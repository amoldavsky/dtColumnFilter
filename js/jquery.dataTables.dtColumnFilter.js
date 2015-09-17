/*
* File:			jquery.dataTables.dtColumnFilter.js
* Version:		2.0
* Author:		Assaf Moldavsky
* URL:			http://github.com/amoldavsky/dtColumnFilter2 
* 
* Copyright 2014-2015 Assaf Moldavsky, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* ------------------------------------------------------------------
* IMPORTANT NOTE:
* 
* This is a re-work of the jqery.datatables.columnFilter.js originally written by
* Jovan Popovic. The original plugin is no longer supported and does not work
* with the new DT versions ( 1.10+ ). 
* 
* This is a complete rework of the original plugin employing better Javascript practices,
* impoved structure, documentation, and performance.
* 
* I simpley needed this to work for my implementation and reworked the plugin
* to work with DataTables 1.10+. I thought that others may be also looking for a newer
* version that is in good working order so here you go.
* 
* The original plugin by Jovan Popovic can be found here:
* http://code.google.com/p/jquery-datatables-column-filter/
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. 
* 
* @author 	Assaf Moldavsky
* @verison	2.0
*/
(function ($) {

	/* 
	 * TODO: convert a filter into an object so that each filter can update or rebuild tself without
	 * rebuilding the entire row
	 */ 
	
	/* 
	 * TODO: breakdown the filter creator function ( fnCreateSelect, fnCreateInput ... etc )
	 */

    $.fn.columnFilter = function ( options ) {

        //var sTableId = "table";
        var sRangeFormat = "From {from} to {to}";
        //Array of the functions that will override sSearch_ parameters
        var afnSearch_ = new Array();
        var aiCustomSearch_Indexes = new Array();

        var oFunctionTimeout = null;
        
        // TODO: expose outside through the options
        var fnOnFiltered = function () { };

        // TODO: add JSDoc
        function _fnGetColumnValues(oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty) {
        	
            // check that we have a column id
            if (typeof iColumn == "undefined") return new Array(); // TODO: assaf: wtf is this crap?? revisit, looks bad

            // by default we only wany unique data
            var bUnique = (typeof bUnique == "boolean") ? bUnique : true;

            // by default we do want to only look at filtered data
            var bFiltered = (typeof bFiltered == "boolean") ? bFiltered : true;

            // by default we do not wany to include empty values
            var bIgnoreEmpty = (typeof bIgnoreEmpty == "boolean") ? bIgnoreEmpty : true;

            // list of rows which we're going to loop through
            var aiRows;
            if ( bFiltered ) { // use only filtered rows
            	
            	aiRows = oSettings.aiDisplay; // use all rows
            	 
            } else { 
            	
            	aiRows = oSettings.aiDisplayMaster; // all row numbers
            	
            }

            // set up data array	
            var asResultData = new Array();

            $.each( aiRows, function( idx, val ) {
            	
                var aData = oTable.fnGetData( val );
                var sValue = aData[ iColumn ];

                // ignore empty values?
                if ( bIgnoreEmpty && sValue.length == 0 ) { 
                	return;
                }
                
                // ignore unique values?
                if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) {
                	return;
                }

                asResultData.push(sValue);
            })

            return asResultData.sort();
        }

        // TODO: add JSDoc
        function _fnColumnIndex(iColumnIndex) {
            if (properties.bUseColVis) {
                return iColumnIndex;
            } else {
                return oTable.fnSettings().oApi._fnVisibleToColumnIndex(oTable.fnSettings(), iColumnIndex);
            }
        }

        // TODO: refactor
        var delay = (function(){
        	var timer = 0;
        	return function(callback, callbackParams, ms){
        		clearTimeout (timer);
        		timer = setTimeout(function(){
        			
        			callback.apply(this,callbackParams);
        			
        		}, ms);
        	};
        })();
        
        /**
		* This is custom function to filter out keys for numeric filter
		*/
	    function isAllowedKeyForNumericFilter(keyCode, shiftKey, ctrlKey){
	    	if ($.inArray(keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
   	             // Allow: Ctrl+A
   	            (keyCode == 65 && ctrlKey === true) ||
   	             // Allow: Ctrl+C
   	            (keyCode == 67 && ctrlKey === true) ||
   	             // Allow: Ctrl+X
   	            (keyCode == 88 && ctrlKey === true) ||
   	             // Allow: home, end, left, right
   	            (keyCode >= 35 && keyCode <= 39)) {
   	                 // let it happen, don't do anything
   	                 return true;
   	        }
   	        // Ensure that it is a number and stop the keypress
   	        if ((shiftKey || (keyCode < 48 || keyCode > 57)) && (keyCode < 96 || keyCode > 105)) {
   	            return false;
   	        }
   	        return true;
	    };
	    
	    function fnCreateInputNumric( oTable, targetTh, regex, smart, iFilterLength, iMaxLenght, label, value, filterIndex ) {
	    	var sCSSClass = "filter number_filter form-control";

            var label = label.replace(/(^\s*)|(\s*$)/g, "");
            
            var search_init = 'search_init ';
            var placeholder = label;
            var inputvalue = value || "";
            
            if (inputvalue != '' && inputvalue != '^') {
            	search_init = '';
            }
            
            var input = $('<input ' 
            		+ 'type="text" ' 
            		+ 'class="' + search_init + sCSSClass + '" ' 
            		+ 'placeholder="' + placeholder + '" ' 
            		+ 'value="' + inputvalue + '" ' 
            		+ 'rel="' + filterIndex + '"/>'
            );
            if (iMaxLenght != undefined && iMaxLenght != -1) {
                input.attr('maxlength', iMaxLenght);
            }
            targetTh.html(input);
            targetTh.wrapInner('<span class="filter_column filter_number" />');
            
        	input.on( "keydown", function(e){
        		
        		if(!isAllowedKeyForNumericFilter(e.keyCode, e.shiftKey, e.ctrlKey)){
            		e.preventDefault();
            	}
        		
        	});
            
            if (!oTable.fnSettings().oFeatures.bServerSide) {
                input.on( "keydown" , function (e) {
                	
                    /* Filter on the column all numbers that starts with the entered value */
                    runFilter('^' + this.value, _fnColumnIndex(index), true, false); //Issue 37
                    fnOnFiltered();
                    
                });
            } else {
                input.on( "keydown" , function (e) {
                	
                	delay(handleKeyDown,[this,filterIndex,iFilterLength,regex, smart], 1000 );
                	
                });
            };
            
            input.on( "focus" ,function (e) {
                if ($(this).hasClass("search_init")) {
                    $(this).removeClass("search_init");
                }
            });
            input.on( "blur", function (e) {
                if ( !this.value ) {
                    $(this).addClass("search_init");
                }
            });
            
            return input;
	    }
	    
        function fnCreateInput( oTable, targetTh, regex, smart, iFilterLength, iMaxLenght, label, value, filterIndex ) {
        	var sCSSClass = "filter text_filter form-control";
            
            var label = label.replace(/(^\s*)|(\s*$)/g, "");
            
            var search_init = 'search_init ';
            var placeholder = label;
            var inputvalue = value || "";
            
            if (inputvalue != '' && inputvalue != '^') {
            	search_init = '';
            }
            
            var input = $('<input ' 
            		+ 'type="text" ' 
            		+ 'class="' + search_init + sCSSClass + '" ' 
            		+ 'placeholder="' + placeholder + '" ' 
            		+ 'value="' + inputvalue + '" ' 
            		+ 'rel="' + filterIndex + '"/>'
            );
            if (iMaxLenght != undefined && iMaxLenght != -1) {
                input.attr('maxlength', iMaxLenght);
            }
            targetTh.html(input);
            targetTh.wrapInner('<span class="filter_column filter_text" />');

            input.on( "keydown" , function (e) {
               	
            	delay(handleKeyDown,[this,filterIndex,iFilterLength,regex, smart], 1000 );
                	
            });
            
            input.on( "focus" ,function (e) {
                if ($(this).hasClass("search_init")) {
                    $(this).removeClass("search_init");
                }
            });
            input.on( "blur", function (e) {
                if ( !this.value ) {
                    $(this).addClass("search_init");
                }
            });
            
            return input;
        }

        function handleKeyDown(input, filterIndex, iFilterLength, regex, smart){
        	if (oTable.fnSettings().oFeatures.bServerSide && iFilterLength && iFilterLength != 0) {
                //If filter length is set in the server-side processing mode
                //Check has the user entered at least iFilterLength new characters
            	
                var currentFilter = oTable.fnSettings().aoPreSearchCols[filterIndex].sSearch;
                var iLastFilterLength = $(input).data("dt-iLastFilterLength");
                if (typeof iLastFilterLength == "undefined")
                    iLastFilterLength = 0;
                var iCurrentFilterLength = input.value.length;
                if (Math.abs(iCurrentFilterLength - iLastFilterLength) < iFilterLength
                //&& currentFilter.length == 0 //Why this?
			        ) {
                    //Cancel the filtering
                    return;
                }
                else {
                    //Remember the current filter length
                    $(input).data("dt-iLastFilterLength", iCurrentFilterLength);
                }
            }
            //run the filter only if the value changed
            var currFilterVal = oTable.fnSettings().aoPreSearchCols[filterIndex].sSearch;
            
            if(input.value != currFilterVal){
            	/* Filter on the column (the index) of this element */
                //runFilter(input.value, _fnColumnIndex(filterIndex), regex, smart); //Issue 37
            	runFilter( input.value, _fnColumnIndex(filterIndex), regex, smart);
                fnOnFiltered();
            }else{
            	return;
            }
        };
        
        function fnCreateRangeInput( oTable, targetTh, filterIndex ) {

			//var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
        	targetTh.html(_fnRangeLabelPart(0));
            var sFromId = oTable.attr("id") + '_range_from_' + filterIndex;
            var from = $('<input type="text" class="number_range_filter form-control" id="' + sFromId + '" rel="' + filterIndex + '"/>');
            targetTh.append(from);
            targetTh.append(_fnRangeLabelPart(1));
            var sToId = oTable.attr("id") + '_range_to_' + filterIndex;
            var to = $('<input type="text" class="number_range_filter form-control" id="' + sToId + '" rel="' + filterIndex + '"/>');
            targetTh.append(to);
            targetTh.append(_fnRangeLabelPart(2));
            targetTh.wrapInner('<span class="filter_column filter_number_range form-control" />');
            
            aiCustomSearch_Indexes.push(filterIndex);



            //------------start range filtering function


            /* 	Custom filtering function which will filter data in column four between two values
            *	Author: 	Allan Jardine, Modified by Jovan Popovic
            */
            //$.fn.dataTableExt.afnFiltering.push(
            oTable.dataTableExt.afnFiltering.push(
		        function (oSettings, aData, iDataIndex) {
		            if (oTable.attr("id") != oSettings.sTableId)
		                return true;
		            // Try to handle missing nodes more gracefully
		            if (document.getElementById(sFromId) == null)
		                return true;
		            var iMin = document.getElementById(sFromId).value * 1;
		            var iMax = document.getElementById(sToId).value * 1;
		            // TODO: Assaf: effeciancy, refactor...
		            var iValue = aData[_fnColumnIndex( filterIndex )] == "-" ? 0 : aData[_fnColumnIndex( filterIndex )] * 1;
		            if (iMin == "" && iMax == "") {
		                return true;
		            }
		            else if (iMin == "" && iValue <= iMax) {
		                return true;
		            }
		            else if (iMin <= iValue && "" == iMax) {
		                return true;
		            }
		            else if (iMin <= iValue && iValue <= iMax) {
		                return true;
		            }
		            return false;
		        }
	        );
            //------------end range filtering function


            // TODO: assaf: convert to use .on() api
            $('#' + sFromId + ',#' + sToId, th).keyup(function () {

                var iMin = document.getElementById(sFromId).value * 1;
                var iMax = document.getElementById(sToId).value * 1;
                if (iMin != 0 && iMax != 0 && iMin > iMax)
                    return;

                oTable.fnDraw();
                fnOnFiltered();
            });

            return {
            	from: from,
            	to: to,
            	index: filterIndex
            };
        }


        function fnCreateDateRangeInput( oTable, targetTh, filterIndex ) {

            var aoFragments = sRangeFormat.split(/[}{]/);

            targetTh.html("");
            var sFromId = oTable.attr("id") + '_range_from_' + filterIndex;
            var from = $('<input type="text" class="date_range_filter form-control" id="' + sFromId + '" rel="' + filterIndex + '"/>');
            from.datepicker();
            
            // TODO: assaf: why a fucking id????? amatures... 
            var sToId = oTable.attr("id") + '_range_to_' + filterIndex;
            var to = $('<input type="text" class="date_range_filter form-control" id="' + sToId + '" rel="' + filterIndex + '"/>');

            for (ti = 0; ti < aoFragments.length; ti++) {

                if (aoFragments[ti] == properties.sDateFromToken) {
                    targetTh.append(from);
                } else {
                    if (aoFragments[ti] == properties.sDateToToken) {
                        targetTh.append(to);
                    } else {
                        targetTh.append(aoFragments[ti]);
                    }
                }
                

            }


            targetTh.wrapInner('<span class="filter_column filter_date_range" />');
            targetTh.datepicker();
            aiCustomSearch_Indexes.push( filterIndex );


            //------------start date range filtering function

            //$.fn.dataTableExt.afnFiltering.push(
            oTable.dataTableExt.afnFiltering.push(
		        function (oSettings, aData, iDataIndex) {
		            if (oTable.attr("id") != oSettings.sTableId) {
		                return true;
		            }
		            
		            var dStartDate = from.datepicker("getDate");
	
		            var dEndDate = to.datepicker("getDate");
	
		            if (dStartDate == null && dEndDate == null) {
		                return true;
		            }
	
		            var dCellDate = null;
		            try { // TODO: assaf: try and catch really? either let it break or handle the edge cases...
		            	
		            	// TODO: assaf: refactor, this is total shit!
		                if (aData[_fnColumnIndex( filterIndex )] == null || aData[_fnColumnIndex( filterIndex )] == "") {
		                    return false;
		                }
		                dCellDate = $.datepicker.parseDate($.datepicker.regional[""].dateFormat, aData[_fnColumnIndex(index)]);
		                
		            } catch (ex) {
		                return false;
		            }
		            if (dCellDate == null) {
		                return false;
		            }
	
		            if (dStartDate == null && dCellDate <= dEndDate) {
		                return true;
		            }
		            else if (dStartDate <= dCellDate && dEndDate == null) {
		                return true;
		            }
		            else if (dStartDate <= dCellDate && dCellDate <= dEndDate) {
		                return true;
		            }
		            return false;
		        }
	        );
            //------------end date range filtering function

            $('#' + sFromId + ',#' + sToId, th).change(function () {
                oTable.fnDraw();
                fnOnFiltered();
            });

            return {
            	from: from,
            	to: to,
            	index: filterIndex
            };
        }

        function fnCreateColumnSelect( oTable, targetTh, aData, iColumn, bRegex, sLabel, oSelected, bMultiselect, filterIndex ) {
            if (aData == null) {
                aData = _fnGetColumnValues(oTable.fnSettings(), iColumn, true, false, true);
            }
            var index = iColumn;
            var currentFilter = oSelected; 

            var r = '<select class="search_init select_filter form-control" rel="' + filterIndex + '"><option value="" class="search_init">' + sLabel + '</option>';
			if(bMultiselect) {
				r = '<select class="search_init select_filter form-control" rel="' + filterIndex + '" multiple>';
			}
            var j = 0;
            var iLen = aData.length;
            for (j = 0; j < iLen; j++) {
            	var data = aData[j];
            	var escapedValue = (data && data.value) ? escape( data.value ) : "";
            	
                if ( typeof data != 'object') {
                    
                    if (escapedValue == currentFilter || escapedValue == escape( currentFilter )) {
                        r += '<option '
                        	+ 'selected '
                        	+ 'value="' + escapedValue + '">' + data.label + '</option>';
                    }
                    
                } else {
                    var selected = '';
                    if (bRegex) {
                        //Do not escape values if they are explicitely set to avoid escaping special characters in the regexp
                        if (escapedValue == currentFilter) {
                        	selected = 'selected ';
                        }
                        
                        r += '<option ' + selected + 'value="' + data.value + '">' + data.label + '</option>';
                    } else {
                        if (escapedValue == currentFilter) {
                        	selected = 'selected ';
                        }
                        
                        r += '<option ' + selected + 'value="' + escapedValue + '">' + data.label + '</option>';
                    }
                }
            }

            var select = $(r + '</select>');
            targetTh.html( select );
            targetTh.wrapInner('<span class="filter_column filter_select" />');
			
			if(bMultiselect) {
				select.change(function () {
					if ( !$(this).val() ) {
						$(this).removeClass("search_init");
					} else {
						$(this).addClass("search_init");
					}
					var selectedOptions = $(this).val();
					var asEscapedFilters = [];
					if(selectedOptions==null || selectedOptions==[]){
						var re = '^(.*)$';
					}else{
						$.each( selectedOptions, function( i, sFilter ) {
							asEscapedFilters.push( fnRegExpEscape( sFilter ) );
						} );
						var re = '^(' + asEscapedFilters.join('|') + ')$';
					}
					 
					runFilter( re, index, true, false );
				});
			} else {
				select.change(function () {
					//var val = $(this).val();
					if ( !$(this).val() ) {
						$(this).removeClass("search_init");
					} else {
						$(this).addClass("search_init");
					}
					if (bRegex) {
						runFilter($(this).val(), iColumn, bRegex); //Issue 41
					} else {
						runFilter(unescape($(this).val()), iColumn); //Issue 25
					}
					fnOnFiltered();
				});
			}
			
			return select;
        }

        function fnCreateSelect( oTable, targetTh, aData, bRegex, bMultiselect, label, oSelected, filterIndex ) {
            var oSettings = oTable.fnSettings();
            if ( (aData == null || typeof(aData) == 'function' ) && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                // Add a function to the draw callback, which will check for the Ajax data having 
                // been loaded. Use a closure for the individual column elements that are used to 
                // built the column filter, since 'i' and 'th' (etc) are locally "global".
                oSettings.aoDrawCallback.push({
                    "fn": (function (iColumn, nTh, sLabel) {
                        return function (oSettings) {
                            // Only rebuild the select on the second draw - i.e. when the Ajax
                            // data has been loaded.
                            if (oSettings.iDraw == 2 && oSettings.sAjaxSource != null && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                                return fnCreateColumnSelect(
                                		oTable, 
                                		nTh, 
                                		(aData && aData(oSettings.aoData, oSettings)), 
                                		_fnColumnIndex(iColumn), 
                                		bRegex,
                                		sLabel, 
                                		oSelected, 
                                		bMultiselect,
                                		filterIndex);
                            }
                        };
                    })(filterIndex, targetTh, label),
                    "sName": "column_filter_" + filterIndex
                });
            }
            // Regardless of the Ajax state, build the select on first pass
            return fnCreateColumnSelect(
            		oTable,
            		targetTh,
            		(typeof(aData) == 'function' ? null: aData), 
            		_fnColumnIndex( filterIndex ), 
            		bRegex,
            		label,
            		oSelected, 
            		bMultiselect,
            		filterIndex);
        }
		 
		function fnRegExpEscape( sText ) { 
			return sText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); 
		};

		function fnCreateDropdown( aData, targetTh, filterIndex ) {
			
			var r = '<div class="dropdown select_filter form-control"><a class="dropdown-toggle" data-toggle="dropdown" href="#">' + label + '<b class="caret"></b></a><ul class="dropdown-menu" role="menu"><li data-value=""><a>Show All</a></li>', j, iLen = aData.length;

			for (j = 0; j < iLen; j++) {
				r += '<li data-value="' + aData[j] + '"><a>' + aData[j] + '</a></li>';
			}
			var select = $(r + '</ul></div>');
			targetTh.html(select);
			targetTh.wrapInner('<span class="filterColumn filter_select" />');
			select.find('li').click(function () {
				
				runFilter($(this).data('value'), filterIndex);
				
			});
			
			return select;
		}
		
		
        function fnCreateCheckbox( oTable, targetTh, aData, label, filterIndex ) {

            if (aData == null) {
                aData = _fnGetColumnValues(oTable.fnSettings(), filterIndex, true, true, true);
            }
            
            var r = '', j, iLen = aData.length;

            //clean the string
            var localLabel = label.replace('%', 'Perc').replace("&", "AND").replace("$", "DOL").replace("£", "STERL").replace("@", "AT").replace(/\s/g, "_");
            localLabel = localLabel.replace(/[^a-zA-Z 0-9]+/g, '');
            //clean the string

            //button label override
            var labelBtn = label;
            if (properties.sFilterButtonText != null || properties.sFilterButtonText != undefined) {
                labelBtn = properties.sFilterButtonText;
            }
            
            var relativeDivWidthToggleSize = 10;
            var numRow = 12; //numero di checkbox per colonna
            var numCol = Math.floor(iLen / numRow);
            if (iLen % numRow > 0) {
                numCol = numCol + 1;
            };

            //count how many column should be generated and split the div size
            var divWidth = 100 / numCol - 2;

            var divWidthToggle = relativeDivWidthToggleSize * numCol;

            if (numCol == 1) {
                divWidth = 20;
            }

            var divRowDef = '<div style="float:left; min-width: ' + divWidth + '%; " >';
            var divClose = '</div>';

            var uniqueId = oTable.attr("id") + localLabel;
            var buttonId = "chkBtnOpen" + uniqueId;
            var checkToggleDiv = uniqueId + "-flt-toggle";
            r += '<button id="' + buttonId + '" class="checkbox_filter btn btn-default" > ' + labelBtn + '</button>'; //filter button witch open dialog
            r += '<div id="' + checkToggleDiv + '" '
            	+ 'title="' + label + '" '
                + 'rel="' + filterIndex + '" '
            	+ 'class="toggle-check ui-widget-content ui-corner-all"  style="width: ' + (divWidthToggle) + '%; " >'; //dialog div
            //r+= '<div align="center" style="margin-top: 5px; "> <button id="'+buttonId+'Reset" class="checkbox_filter" > reset </button> </div>'; //reset button and its div
            r += divRowDef;

            for (j = 0; j < iLen; j++) {

                //if last check close div
                if (j % numRow == 0 && j != 0) {
                    r += divClose + divRowDef;
                }

                var sLabel = aData[j];
                var sValue = aData[j];

                if (typeof (aData[j]) == 'object') {
                    sLabel = aData[j].label;
                    sValue = aData[j].value;
                }

                //check button
                r += '<input class="search_init checkbox_filter btn btn-default" type="checkbox" id= "' + uniqueId + '_cb_' + sValue + '" name= "' + localLabel + '" value="' + sValue + '" >' + sLabel + '<br/>';

                var checkbox = $(r);
                targetTh.html(checkbox);
                targetTh.wrapInner('<span class="filter_column filter_checkbox" />');
                //on every checkbox selection
                checkbox.change(function () {

                    var search = '';
                    var or = '|'; //var for select checks in 'or' into the regex
                    var resSize = $('input:checkbox[name="' + localLabel + '"]:checked').size();
                    $('input:checkbox[name="' + localLabel + '"]:checked').each(function ( index ) {

                        //search = search + ' ' + $(this).val();
                        //concatenation for selected checks in or
                        if ((index == 0 && resSize == 1)
                				|| (index != 0 && index == resSize - 1)) {
                            or = '';
                        }
                        //trim
                        search = search.replace(/^\s+|\s+$/g, "");
                        search = search + $(this).val() + or;
                        or = '|';

                    });


                    if (search != "") {
                        $('input:checkbox[name="' + localLabel + '"]').removeClass("search_init");
                    } else {
                        $('input:checkbox[name="' + localLabel + '"]').addClass("search_init");
                    }

                    //execute search
                    runFilter(search, index, true, false);
                    fnOnFiltered();
                });
                
                return checkbox;
            }

            //filter button
            $('#' + buttonId).button();
            //dialog
            $('#' + checkToggleDiv).dialog({
                //height: 140,
                autoOpen: false,
                //show: "blind",
                hide: "blind",
                buttons: [{
                    text: "Reset",
                    click: function () {
                        //$('#'+buttonId).removeClass("filter_selected"); //LM remove border if filter selected
                        $('input:checkbox[name="' + localLabel + '"]:checked').each(function (index3) {
                            $(this).attr('checked', false);
                            $(this).addClass("search_init");
                        });
                        runFilter('', index, true, false);
                        fnOnFiltered();
                        return false;
                    }
                },
							{
							    text: "Close",
							    click: function () { $(this).dialog("close"); }
							}
						]
            });


            $('#' + buttonId).click(function () {

                $('#' + checkToggleDiv).dialog('open');
                var target = $(this);
                $('#' + checkToggleDiv).dialog("widget").position({ my: 'top',
                    at: 'bottom',
                    of: target
                });

                return false;
            });

            var fnOnFilteredCurrent = fnOnFiltered;

            fnOnFiltered = function () {
                var target = $('#' + buttonId);
                $('#' + checkToggleDiv).dialog("widget").position({ my: 'top',
                    at: 'bottom',
                    of: target
                });
                fnOnFilteredCurrent();
            };
            //reset
            /*
            $('#'+buttonId+"Reset").button();
            $('#'+buttonId+"Reset").click(function(){
            $('#'+buttonId).removeClass("filter_selected"); //LM remove border if filter selected
            $('input:checkbox[name="'+localLabel+'"]:checked').each(function(index3) {
            $(this).attr('checked', false);
            $(this).addClass("search_init");
            });
            runFilter('', index, true, false);
            return false;
            }); 
            */
        }




        function _fnRangeLabelPart(iPlace) {
            switch (iPlace) {
                case 0:
                    return sRangeFormat.substring(0, sRangeFormat.indexOf("{from}"));
                case 1:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{from}") + 6, sRangeFormat.indexOf("{to}"));
                default:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{to}") + 4);
            }
        }

        function createTR(colnum, settings){
        	var i=0, trstart = "<tr>", trend="</tr>", th="<th></th>", row=trstart;
        	for(i=0;i<colnum;i++){
        		row = row+th;
        	}
        	return row+trend;
        }
        
        var oTable = this;
        
        var defaults = {
            sPlaceHolder: "foot",
            sRangeSeparator: "~",
            iFilteringDelay: 500,
            aoColumns: null,
            sRangeFormat: "From {from} to {to}",
            sDateFromToken: "from",
            sDateToToken: "to"
        };

        var properties = $.extend(defaults, options);
        
        // custom added by assaf - we want to catch when fnFilter and fnClearFilter are called and update 
        // our filters
        (function( dt ) {
        	
        	var _search = dt.search;
        	dt.on( 'search.dt', function (e) {
        		
        		updateFilters();
        		
        	} );
        	
        })( oTable );
        
        // custom edit by Assaf, add a centralized filtering function
        function runFilter( query, colIdx, regex, isSmart, isCaseInsensative ) {
        	
        	// the older dt implementation used to call fnFilter but since 1.10 the recommendation is to use this api
        	return oTable.DataTable().columns( colIdx ).search( query, regex, isSmart, isCaseInsensative ).draw();
        	
        };
        
        // Assaf - function to update the filters UI in case the search values have changed from the DT native API ( like calling .search() )
        function updateFilters( options ) {
        	
        	// TODO: thsi is called twice, once at search and second time when re-draw, need to fix!
        	var settings = oTable.fnSettings();
        	$.each( properties.aoColumns, function( idx, val ) {
        		if( !val ) return;
        		
        		if( (filterElem = colFilterIndexToElementMap[ idx ]) ) {
        			
        			// set the correct value
        			$( filterElem ).val( settings.aoPreSearchCols[ idx ].sSearch );
        			
        		};
        		
        	});
        	
        };
        
        // Assaf: custom map to map column index to filter element
        var colFilterIndexToElementMap = Array.apply(null, {
            length: oTable.fnSettings().aoPreSearchCols.length
        }).map(function () { return null });
        
        /*
        function Filter() {
        	
        	return {
            	type: "text",
                bRegex: false,
                bSmart: true,
                iMaxLenght: -1,
                iFilterLength: 0
        	};
        };
        */
        
        var FILTER_TYPE_TEXT = "test";
        var FILTER_TYPE_NUMBER = "number";
        var FILTER_TYPE_SELECT = "select";
        var FILTER_TYPE_TWITTER_DROPDOWN = "twitter-dropdown";
        var FILTER_TYPE_RANGE_NUMBER = "number-range";
        var FILTER_TYPE_RANGE_DATE = "date-range";
        var FILTER_TYPE_CHECKBOX = "checkbox";
        var FILTER_TYPE_DROPDOWN = "dropdown";
        
        function buildFiltersRow( aoFilterCells, aoColumns ) {
        	
        	colFilterIndexToElementMap = [];
        	var filterRow = $(createTR(aoFilterCells.length));
        	
            $( aoFilterCells ).each(function ( idx ) {
                var aoColumn = null;
                
                if ( aoColumns && aoColumns.length ) {
                	// Assaf: is this even possible???
                    if ( aoColumns.length < idx ){
                        return;
                    }
                    
                    aoColumn = aoColumns[ idx ];
                }
                if( !aoColumn ) {
                	return;
                }
                
                var label = $($(this)[0].cell).text();
                var th = $( filterRow[0].cells[ idx ] );
                
                if (aoColumn.sRangeFormat != null) {
                    sRangeFormat = aoColumn.sRangeFormat;
                } else {
                    sRangeFormat = properties.sRangeFormat;
                }
                
                // create the filter in the DOM
                var createdElement = (function( aoColumn ) {
                	
                	var createdElement = null;
                	
                	switch (aoColumn.type) {
	                    case "null":
	                    	
	                        break;
	                        
	                    case FILTER_TYPE_NUMBER:
	                    	
	                    	var filterValue = oTable.fnSettings().aoPreSearchCols[ idx ].sSearch;
	                        if (filterValue != '' && filterValue != '^') {
	                            if (filterValue.charAt(0) == '^') {
	                            	filterValue = filterValue.substr(1);
	                            } else {
	                            	filterValue = filterValue;
	                            }
	                        }
	                    	createdElement = fnCreateInputNumric(
	                    			oTable,
	                    			th,
	                    			true, 
	                    			false, 
	                    			aoColumn.iFilterLength, 
	                    			aoColumn.iMaxLenght,
	                    			label,
	                    			filterValue, 
	                    			idx);
	                        break;
	                        
	                    case FILTER_TYPE_SELECT:
	                    	
	                        if (aoColumn.bRegex != true) {
	                            aoColumn.bRegex = false;
	                        }
	                        var selectedOption = oTable.fnSettings().aoPreSearchCols[ idx ].sSearch || aoColumn.selected;
	                        createdElement = fnCreateSelect(oTable, th, aoColumn.values, aoColumn.bRegex, aoColumn.multiple, label, selectedOption, idx);
	                        break;
	                        
	                    case FILTER_TYPE_RANGE_NUMBER:
	                    	
	                    	// TODO: how does this function get the possible values and labels for the range
	                    	createdElement = fnCreateRangeInput( oTable, th, idx );
	                        break;
	                        
	                    case FILTER_TYPE_RANGE_DATE:

	                    	// TODO: how does this function get the possible values and labels for the range
	                    	createdElement = fnCreateDateRangeInput( oTable, th, idx );
	                        break;
	                        
	                    case FILTER_TYPE_CHECKBOX:
	                    	
	                    	createdElement = fnCreateCheckbox( oTable, th, aoColumn.values, label, idx );
	                        break;
	                        
						case FILTER_TYPE_TWITTER_DROPDOWN:
						case FILTER_TYPE_DROPDOWN:
							
							createdElement = fnCreateDropdown( aoColumn.values, th, idx );
	                        break;
	                        
	                    case FILTER_TYPE_TEXT:
	                    default:
	                    	
	                        bRegex = (aoColumn.bRegex == null ? false : aoColumn.bRegex);
	                        bSmart = (aoColumn.bSmart == null ? false : aoColumn.bSmart);
	                        var filterValue = oTable.fnSettings().aoPreSearchCols[ idx ].sSearch;
	                        createdElement = fnCreateInput(
	                        		oTable,
	                        		th,
	                        		bRegex, 
	                        		bSmart, 
	                        		aoColumn.iFilterLength, 
	                        		aoColumn.iMaxLenght,
	                        		label,
	                        		filterValue, 
	                        		idx);
	                        break;
	
	                }
                	
                	return createdElement;
                	
                })( aoColumn );
                
                // add the newly created element to our map
                colFilterIndexToElementMap[ idx ] = createdElement;
            });
            
            filterRow.addClass( "dt-columnFilters" );
            return filterRow;
        }
        
        return this.each(function (index) {

            if (!oTable.fnSettings().oFeatures.bFilter) {
                return;
            }

            var aoFilterCells = oTable.fnSettings().aoFooter[0];

            var oHost = oTable.fnSettings().nTFoot; //Before fix for ColVis
            var sFilterRow = "tr"; //Before fix for ColVis
            var $filterRow;

            // Assaf: add ability to self refresh on new ajax fetch
            if( typeof properties.onDTReload === 'function' ) {
            
            	oTable.on('processing.dt', function ( e, settings, json, xhr ) {
            		var newColumns = properties.aoColumns;
            		
            		var newfilterRow = buildFiltersRow( aoFilterCells, properties.aoColumns, false );
	        		var oldFilterRow = $filterRow;
	        		$filterRow.replaceWith( newfilterRow );
	        		$filterRow = newfilterRow;
	        		oldFilterRow.remove();
	        		oldFilterRow = null;
            	});
            	
    	        oTable.on('xhr.dt', function ( e, settings, json, xhr ) {
    	            
    	        	if( (newColumns = properties.onDTReload.call( $filterRow, json )) ) {
    	        		properties.aoColumns = newColumns;
    	        	}
    	            
    	        });
            
            }
            
            if (properties.sPlaceHolder == "head:after") {
                var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                //tr.appendTo($(oTable.fnSettings().nTHead));
                if (oTable.fnSettings().bSortCellsTop) {
                    tr.prependTo($(oTable.fnSettings().nTHead));
                    //tr.appendTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                }
                else {
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    //tr.prependTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }
                sFilterRow = "tr:last";
                oHost = oTable.fnSettings().nTHead;

            } else if (properties.sPlaceHolder == "head:before") {

                if (oTable.fnSettings().bSortCellsTop) {
                    var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                } else {
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }
                
                sFilterRow = "tr:first";
                oHost = oTable.fnSettings().nTHead;
               
            }
            
            var $filterRow = buildFiltersRow( aoFilterCells, properties.aoColumns );
            $filterRow.appendTo($(oTable.fnSettings().nTHead));
            // run search for all the pre-loaded filters
            //runFilter(unescape(selected), i);
			            
            for (j = 0; j < aiCustomSearch_Indexes.length; j++) {
                //var index = aiCustomSearch_Indexes[j];
                var fnSearch_ = function () {
                    var id = oTable.attr("id");
                    return $("#" + id + "_range_from_" + aiCustomSearch_Indexes[j]).val() + properties.sRangeSeparator + $("#" + id + "_range_to_" + aiCustomSearch_Indexes[j]).val()
                }
                afnSearch_.push(fnSearch_);
            }

            /*this was commented out below by serge to make it work with the new datatable code 1.10*/
            /*
            if (oTable.fnSettings().oFeatures.bServerSide) {

                var fnServerDataOriginal = oTable.fnSettings().fnServerData;

                oTable.fnSettings().fnServerData = function (sSource, aoData, fnCallback) {

                    for (j = 0; j < aiCustomSearch_Indexes.length; j++) {
                        var index = aiCustomSearch_Indexes[j];

                        for (k = 0; k < aoData.length; k++) {
                            if (aoData[k].name == "sSearch_" + index)
                                aoData[k].value = afnSearch_[j]();
                        }
                    }
                    aoData.push({ "name": "sRangeSeparator", "value": properties.sRangeSeparator });

                    if (fnServerDataOriginal != null) {
                        try {
                            fnServerDataOriginal(sSource, aoData, fnCallback, oTable.fnSettings()); //TODO: See Issue 18
                        } catch (ex) {
                            fnServerDataOriginal(sSource, aoData, fnCallback);
                        }
                    }
                    else {
                        $.getJSON(sSource, aoData, function (json) {
                            fnCallback(json)
                        });
                    }
                };

            }*/

        });

    };

})(jQuery);
