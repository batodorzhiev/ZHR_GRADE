/*global location history */
sap.ui.define([
	"ZHR_GRADE/ZHR_GRADE/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ZHR_GRADE/ZHR_GRADE/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/m/MessageBox',
	'sap/m/MessageToast'
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("ZHR_GRADE.ZHR_GRADE.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var pepModel = this.getOwnerComponent().getModel("pep");
			sap.ui.core.BusyIndicator.show();
			var pepFilter = new Filter({
				path: "Sername",
				operator: "EQ",
				value1: "ZHR_KPI_APP_SRV"
			});
			var textBundle = this.getResourceBundle();
			pepModel.metadataLoaded().then(function() {
				pepModel.read("/StampSet", {
					filters: [pepFilter],
					success: function(e) {
						var data = e.results[0];
						if (data.Message) {
							MessageBox.warning(data.Message, {
								onClose: function() {
									history.go(-1);
								}
							});
						}
						sap.ui.core.BusyIndicator.hide();
					},
					error: function() {
						MessageBox.warning(textBundle.getText("serviceError"), {
							onClose: function() {
								history.go(-1);
							}
						});
						sap.ui.core.BusyIndicator.hide();
					}
				});
			});
			// Model used to manipulate control states
			var oViewModel = new JSONModel();
			this.setModel(oViewModel, "worklistView");

			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#ГодоваяОценкаРаботника-display"
			}, true);

			this.getRouter().getRoute("worklist").attachPatternMatched(this.onWorklistMatched, this);

			// Set mock data
			this.year = new Date().getFullYear().toString();
			var mockModel = new JSONModel();
			this.setModel(mockModel, "mockModel");
			mockModel.setProperty("/Year", this.year);

			// Scroll to last item in timeline
			this.byId("timeline").addEventDelegate({
				onAfterRendering: function(e) {
					var items = e.srcControl.getContent();
					if (items.length > 0) {
						items[items.length - 1].focus();
						$(".sapMPageEnableScrolling").scrollTop(0);
					}
				}
			}, this);
		},

		onWorklistMatched: function(e) {
			var args = e.getParameter("arguments");
			this.username = sap.ushell.Container.getService("UserInfo").getId();
			this.year = args.year ? args.year : this.year;
			if (this.username === "DEFAULT_USER") {
				this.username = "BDDORZHIEV";
			}
			this.getModel().metadataLoaded().then(function() {
				this.path = this.getModel().createKey("/PersonSet", {
					Uname: this.username,
					Year: this.year,
					Reqid: "0"
				});
				this.getView().bindElement({
					path: this.path,
					events: {
						change: this.bindingChanged.bind(this)
					}
				});
			}.bind(this));
			var enabled = this.year !== new Date().getFullYear().toString();
			this.getModel("appView").setProperty("/isPresentYear", enabled);
			this.getModel("appView").setProperty("/thisYear", this.year);
		},

		bindingChanged: function() {
			var elementBinding = this.getView().getElementBinding();
			if (elementBinding.oElementContext) {
				this.data = this.getView().getBindingContext().getObject();
				this.reqid = this.data.Reqid;
				this.status = this.data.Status;
				this.originalStatus = this.originalStatus ? this.originalStatus : this.status;
			}
		},

		onTableSelect: function(e) {
			var table = e.getSource();
			var buttons = table.getHeaderToolbar().getContent();
			var deleteButton = buttons[buttons.length - 1];
			var selectedItems = table.getSelectedItems().length;
			var enabled = selectedItems ? true : false;
			deleteButton.setEnabled(enabled);
		},

		remove: function(e) {
			var table = this.byId("table");
			var deleteButton = e.getSource();
			var i18n = this.getResourceBundle();
			var that = this;
			MessageBox.confirm(i18n.getText("askDelete"), {
				actions: [i18n.getText("delete"), sap.m.MessageBox.Action.CLOSE],
				onClose: function(sAction) {
					if (sAction === i18n.getText("delete")) {
						var items = table.getSelectedItems();
						// Define items to be removed
						items.forEach(function(item) {
							item.data("remove", true);
						});
						table.removeSelections(true);
						that.submit("deleteButton", i18n.getText("deleteOk"));
						deleteButton.setEnabled(false);
					} else {
						MessageToast.show(i18n.getText("deleteCancel"));
					}
				}
			});
		},

		add: function() {
			var table = this.byId("table");
			var newItem = table.mBindingInfos.items.template.clone();
			table.addItem(newItem.data("new", "true"));
			setTimeout(function() {
				newItem.focus();
			}, 0);
			this.setEnabled(["saveButton", "sendButton"], false);
		},

		onLiveChange: function() {
			var items = this.getView().getControlsByFieldGroupId("onLiveChange");
			var enabled = true;
			var filteredItems = items.filter(function(item) {
				return item.getBindingInfo("value") ? true : false;
			});
			filteredItems.forEach(function(item) {
				if (!item.getValue()) {
					enabled = false;
				}
			});
			this.setEnabled(["saveButton", "sendButton"], enabled);
		},

		onSelectYear: function(e, history) {
			this.year = e ? e.getSource().getSelectedKey() : this.year;
			var settings = {
					year: this.year
				},
				saveHistory = history ? true : false,
				i18n = this.getResourceBundle(),
				askText = history ? i18n.getText("askCopy") : i18n.getText("askYear"),
				actionText = history ? i18n.getText("copy") : i18n.getText("move"),
				router = this.getRouter();
			MessageBox.confirm(askText, {
				actions: [actionText, sap.m.MessageBox.Action.CLOSE],
				onClose: function(sAction) {
					if (sAction === actionText) {
						router.navTo("worklist", settings, saveHistory);
					} else {
						MessageToast.show(i18n.getText("actionCancel"));
					}
				}
			});
		},

		copy: function(e) {
			var tableItems = this.byId("table").getItems(),
				model = this.getModel(),
				that = this;
			this.year = this.byId("copyYear").getSelectedKey();
			var path = model.createKey("/PersonSet", {
				Uname: this.username,
				Year: this.year,
				Reqid: "0"
			});
			model.read(path, {
				success: function(data) {
					if (data.Status === "01" && tableItems.length) {
						// Save items in tableItems array to add them after copying
						that.tableItems = [];
						tableItems.forEach(function(item) {
							var value = item.getCells()[0].getValue();
							this.tableItems.push(value);
						}, that);
						// that.year = new Date().getFullYear().toString();
						that.onSelectYear(null, true);
						that.onDialog("copyYearDilogCancel");
					} else if (data.Status !== "01") {
						MessageToast.show(that.getResourceBundle().getText("noCopyStatus"));
					} else if (tableItems.length === 0) {
						MessageToast.show(that.getResourceBundle().getText("noCopyItems"));
					}
				}
			});
		},

		submit: function(e, argText) {
			var model = this.getModel(),
				odata = this.data,
				button = typeof e === "string" ? this.byId(e) : e.getSource(),
				table = this.byId("table"),
				items = table.getItems(),
				goals = [],
				textBundle = this.getResourceBundle(),
				text = argText ? argText : textBundle.getText("saveText"),
				saveButton = this.byId("saveButton"),
				elementBinding = this.getView().getElementBinding(),
				page = this.byId("page"),
				status = button.data("status");

			items.forEach(function(item) {
				// Send goals only that are not for removal(for remove function)
				if (!item.data("remove")) {
					var obj = {};
					var textArea = item.getAggregation("cells")[0];
					obj.Text = textArea.getValue();
					obj.Purposeid = textArea.data("Purposeid") ? textArea.data("Purposeid") : "";
					goals.push(obj);
				}
			}, this);
			odata.Status = status;
			odata.ToGoals = goals;
			odata.ToTimeline = [];
			if (status === "02") {
				text = textBundle.getText("approveText");
				button.setEnabled(false);
			}
			page.setBusy(true);
			model.create("/PersonSet", odata, {
				success: function(data) {
					MessageToast.show(text);
					saveButton.setEnabled(false);
					items.forEach(function(item) {
						if (item.data("new")) {
							table.removeItem(item);
						}
					});
					elementBinding.refresh(true);
					table.fireUpdateFinished();
					page.setBusy(false);
				},
				error: function() {
					MessageToast.show(textBundle.getText("error"));
					page.setBusy(false);
				}
			});
		},

		onTableLoaded: function(e) {
			var table = e.getSource();
			var enabled = this.status === "01" || this.status === "04" ? true : false;
			this.setEnabled(["table"], enabled);
			// Set send button active if the status is В работе and table has goals
			enabled = (this.status === "01" || this.status === "04") && table.getItems().length > 0 ? true : false;
			this.byId("sendButton").setEnabled(enabled);
			// Set items if copy function called
			if (this.tableItems) {
				this.tableItems.forEach(function(value) {
					var column = new sap.m.ColumnListItem({
						cells: [new sap.m.TextArea({
							value: value,
							maxLength: 1000,
							fieldGroupIds: "onLiveChange",
							growing: true,
							rows: 2,
							liveChange: this.onLiveChange.bind(this),
							width: "100%"
						})],
						width: "100%"
					});
					table.addItem(column.data("copy", "true"));
				}, this);
				this.tableItems = null;
				var items = this.getFieldGroups(this.getView().getControlsByFieldGroupId("onLiveChange"));
				items.forEach(function(text) {
					text.setEnabled(true);
				});
				// remove previously added new items
				table.getItems().forEach(function(newItem) {
					if (newItem.data("new")) {
						table.removeItem(newItem);
					}
				});
				this.byId("saveButton").setEnabled(true);
			} else {
				table.getItems().forEach(function(item) {
					if (item.data("copy")) {
						table.removeItem(item);
					}
				});
			}
		},

		onExport: function() {
			var url = "/sap/opu/odata/sap/ZHR_KPI_APP_SRV/FileSet(ReqId='" + this.reqid + "',Filename='1',Year='" + this.year + "')/$value";
			window.open(url);
		},

		onDialog: function(e) {
			var button = typeof e === "string" ? this.byId(e) : e.getSource(),
				id = button.data("id"),
				open = button.data("open"),
				dialog = this.byId(id);
			if (open) {
				dialog.open();
			} else {
				dialog.close();
			}
		}
	});
});