sap.ui.define([], function() {
	"use strict";

	return {
		status: function(value) {
			if (typeof value === "string") {
				switch (value) {
					case "01":
						return true;
					default:
						return false;
				}
			}
		},
		year: function(value) {
			var returnBoolean = false;
			if (value) {
				var yearNow = new Date().getFullYear().toString();
				if (yearNow === value) {
					returnBoolean = true;
				}
			}
			return returnBoolean;
		},
		color: function(value) {
			if (typeof value === "string") {
				var state = value.toLowerCase();
				if (state === "02" || state === "05" || state === "11") {
					return "Warning";
				} else if (state === "03" || state === "06" || state === "09" || state === "10") {
					return "Success";
				} else if (state === "04" || state === "07" || state === "08") {
					return "Error";
				} else {
					return "None";
				}
			}
		},
		icon: function(value) {
			if (typeof value === "string") {
				var state = value.toLowerCase();
				switch (state) {
					case "01":
						return "sap-icon://user-edit";
					case "02":
						return "sap-icon://create-form";
					case "03":
						return "sap-icon://user-edit";
					case "04":
						return "sap-icon://edit";
					case "05":
						return "sap-icon://add-equipment";
					case "06":
						return "sap-icon://employee-approvals";
					case "07":
						return "sap-icon://cancel-maintenance";
					case "08":
						return "sap-icon://unlocked";
					case "09":
						return "sap-icon://accept";
					case "10":
						return "sap-icon://locked";
					case "11":
						return "sap-icon://multi-select";
					default:
						return "sap-icon://overflow";
				}
			}
		}
	};

});