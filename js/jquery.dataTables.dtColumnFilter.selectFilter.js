/**
* File:			jquery.dataTables.dtColumnFilter.selectFilter.js
* Version:	2.0
* Author:		Assaf Moldavsky
* URL:			http://github.com/amoldavsky/dtColumnFilter
* 
* ------------------------------------------------------------------
* Copyright 2014-2015 Assaf Moldavsky, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* ------------------------------------------------------------------
*
* This is an extension to the dtColumnFilter to add the HTML select Filter.
* This Filter would use the standard HTML select box. It may be somewhat limiting
* and you may want to use the DropDown filter instead.
*
*@author Assaf Moldavsky
*@version 2.0
*/

(function ($) {
	$.fn.DataTable.dtColumnFilter.extend( function( dtColumnFilter ) {
	
		var FilterFactory = dtColumnFilter.FilterFactory;
		
		var DEFAULT_FILTER_CSS_CLASS = "form-control";
		
		FilterFactory.types.FILTER_TYPE_SELECT = "select";
		FilterFactory.constructors[ FilterFactory.types.FILTER_TYPE_SELECT ] = function( filterDefs, callbacks ) {
			
			// _table, targetTh, aData, bRegex, bMultiselect, label, oSelected, filterIndex
	    	
	    	var defaultOptions = {
	    		cssClass: DEFAULT_FILTER_CSS_CLASS + " filter_type_select",
	    		label: "",
	    		value: null,
	    		values: []
	    	};
            var effectiveFilterDefs = $.extend( defaultOptions, filterDefs );

            var select = ''
            	+ '<select '
            	+ 'class="' + effectiveFilterDefs.cssClass + '" ' 
            	+' >'
            		+'<option value="">' + "No Filter" + '</option>';
            
            var values = effectiveFilterDefs.values;
			
            var options = "";
            for (var j = 0, len = values.length ; j < len; j++) {
            	
            	var optionObject = values[j];
            	
            	var option = ''
            		+ '<option selected '
                		+ 'value="' + optionObject.value + '">' + optionObject.label + '</option>';
            	
            	options += option;
               
            }
            select += options;

            select += '</select>';
            
            var $seelct = $( select );
			
            $seelct.on('focus', function () {
            	
            	this._$this = this._$this || $( this );
            	this._$this.data( "oldValue", this._$this.val() );
            	
            });
            $seelct.on( "change", function () {
            	
            	this._$thclassis = this._$this || $( this );
            	callbacks.onValueChanged( $(this).val(), this._$this.data( "oldValue" ) ); 
				
			});
            
			return $seelct[0];
            
		};
		
	});
})( jQuery );
