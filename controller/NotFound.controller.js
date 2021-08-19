sap.ui.define([
		"ZHR_GRADE/ZHR_GRADE/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("ZHR_GRADE.ZHR_GRADE.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);