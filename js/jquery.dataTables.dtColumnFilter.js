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

	$.fn.DataTable.dtColumnFilter = function ( dtInstance, options ) {
    	
		var _table = dtInstance[ 0 ];
		var _dtInstance = dtInstance.DataTable();
		
    	var Filter = (function() {
    		
    		var DEFAULT_FILTER_CSS_CLASS = "filter form-control"; //TODO: remove the form-control into an option passed to this plugin
    		
    		/**
    		 * Filter class
    		 */
    		var Filter = function( domElement ) {
    			
    			// reference to the DOM element
    			this.domElem = domElement;
    			
    			return { // a Filter Object API
    				
    				/**
    				 * Updates the filter given new options.
    				 * Typically useful when the column definitions or
    				 * filter values / options change on the fly.
    				 * @param	options		new filter options
    				 */
    				update: function( options ) {
    					// TODO
    				},
    				/**
    				 * Applys a new value to the filter
    				 * @param	value	new filter values
    				 */
    				filter: function( value ) {
    					// TODO
    				},
    				
    				/**
    				 * A destroyer function to destroy the filter
    				 */
    				destroy: function() {
    					// TODO
    				},
    				
    				/**
    				 * Reference to the DOM element
    				 */
    				DOMElem: domElement
    			};
    		};
    		
    	    
    		/**
    	     * Each of the create function are meant to do one and only one job well, that is 
    	     * to create the DOM element and nothing else. All other logic, indexing, tracking... etc
    	     * MSUT be done outside of this
    	     */
    		
    	    function fnCreateInputText( options, callbacks ) {
    	    	
    	    	var defaultOptions = {
    	    		cssClass: DEFAULT_FILTER_CSS_CLASS + " filter_type_input_text",
    	    		label: "",
    	    		value: "",
    	    		minLength: 1,
    	    		maxLength: 10
    	    	};
                var effectiveOptions = $.extend( defaultOptions, options );
                
                var input = $( ''
            		+ '<input type="text" ' 
                		+ 'class="' + effectiveOptions.cssClass + '" ' 
                		+ 'placeholder="' + effectiveOptions.label + '" ' 
                		+ 'value="' + effectiveOptions.value + '"'
            		+ '/>'
                );
                if ( effectiveOptions.maxLength && effectiveOptions.maxLength > 0 ) {
                    input.attr( 'maxlength', effectiveOptions.maxLength );
                }
                if ( effectiveOptions.minLength && effectiveOptions.minLength > 0 ) {
                	input.data( "minlength", effectiveOptions.minLength );
                }
                
                // event handlers
                input.on( "keydown", function( e ) {
                	
                	this._$this = this._$this || $( this );
                	var oldValue = this.value || "";
                	this._$this.data( "oldValue", oldValue );
                	
                });
                input.on( "keyup", function( e ) {
            		
                	this._$this = this._$this || $( this );
                	
            		if( (value = this.value) ) {
            			
            			// if the value did not change than we did not add anything to the input (maybe a shit or a ctrl been pressed... )
            			if( value != (oldValue = this._$this.data( "oldValue" )) ) { 
            			
	                        if( (minLength = this._$this.data( "minlength" ) || 1) && (value.length >= minLength)) {
	                        	
	                        	// we do not check if the value is the same as it used to be by design
	                        	callbacks.onValueChanged && callbacks.onValueChanged( value, oldValue );
	                        	
	                        }
            			}
            			
            		} else if( (oldValue = this._$this.data( "oldValue" )) ) { // the input was erased
            			
            			callbacks.onValueChanged && callbacks.onValueChanged( "", this._$this.data( "oldValue" ) );
            			
            		}
            		
            	});
                
                return input;
    	    }
    	    
    	    function fnCreateSelect( options, callbacks ) {
    	    	
    	    	// _table, targetTh, aData, bRegex, bMultiselect, label, oSelected, filterIndex
    	    	
    	    	var defaultOptions = {
    	    		cssClass: DEFAULT_FILTER_CSS_CLASS + " filter_type_select",
    	    		label: "",
    	    		value: null,
    	    		values: []
    	    	};
                var effectiveOptions = $.extend( defaultOptions, options );

                var select = ''
                	+ '<select '
                	+ 'class="' + effectiveOptions.cssClass + '" ' 
                	+' >'
                		+'<option value="" class="search_init">' + effectiveOptions.label + '</option>';
                
                var values = effectiveOptions.values;
    			
                for (var j = 0, len = values.length ; j < len; j++) {
                	
                	var optionObject = values[j];
                	
                	var option = ''
                		+ '<option selected '
                    	+ 'value="' + optionObject.value + '">' + optionObject.label + '</option>';
                	
                	select += option;
                   
                }

                select += '</select>';
                
                var $seelct = $( select );
    			
                $seelct.on('focus', function () {
                	
                	this._$this = this._$this || $( this );
                	this._$this.data( "oldValue", this._$this.val() );
                	
                });
                $seelct.on( "change", function () {
                	
                	this._$this = this._$this || $( this );
                	callbacks.onValueChanged && callbacks.onValueChanged( $(this).val(), this._$this.data( "oldValue" ) ); 
					
				});
	    		
    			return $seelct;
            }
    		
    	    /*
			 * Filter types
			 */
    	    // TODO: we need to be able to expose these types so that extensions can be added with more types
    	    var filterTypes = {
		        FILTER_TYPE_TEXT: "text",
		        FILTER_TYPE_SELECT: "select"
    	    };
    	    
    		return $.extend( filterTypes, {
    			
    			/**
    			 * Filter factory function to create a particular filter
    			 * @param	filterType	A filter type, must be from the definitions
    			 * @param	options		Options object for the particular filter
    			 */
    			factory: function( filterType, options, callbacks ) {
    				
    				var createdElement = null;
                	
                	switch ( filterType ) {
	                    case "null":
	                    	
	                        break;
	                        
	                    case filterTypes.FILTER_TYPE_TEXT:
	                    	
	                    	createdElement = fnCreateInputText( options, callbacks );
	                    	
	                        break;
	                    
	                    case filterTypes.FILTER_TYPE_SELECT:
	                    	
	                        //var selectedOption = _dtInstance.settings()[0].aoPreSearchCols[ idx ].sSearch || aoColumn.selected;
	                        createdElement = fnCreateSelect( options, callbacks );
	                        
	                        break;
	                }
                	
                	var filterObj = new Filter( createdElement );
                	return filterObj;
    				
    			},
    			
    		});
    	})();
    	
    	//------------------------------ Init:
    	var _filterElem = (function( table, filterColumns ) {
    		
    		var tr = "";
    		
    		tr += "<tr>";
    		for( var i = filterColumns.length; i > 0; i-- ) {
    			tr += "<th></th>";
    		}
    		tr += "</tr>";
    		
    		var $tr = $( tr );
    		$tr.addClass( "dt-columnFilters" ); // TODO: change the classname
    		
    		$( "thead", table ).append( $tr );
    		
        	return $tr;
    		
    	})( _table, options.filterColumns );
    	
    	// Timer execution
    	var Timer = (function() {
    		
    		var timerBuckets = {};
    		
    		return {
    			/**
    			 * Will queue a function in a given bucket, meaning it will replace whatever is in the current bucket
    			 * with what is supplied to this function. This is good for delayed inputs when you have a few seconds
    			 * interval between doing something with the input.
    			 * @param	bucket	timer bucket
    			 * @param	fn		the function to execute
    			 * @param	delay	the delay time in ms
    			 */
    			queue: function( bucket, fn, delay ) {
    				
    				if( (currentTimeoutId = timerBuckets[ bucket ]) ) {
    					clearTimeout( currentTimeoutId );
    				}
    				timerBuckets[ bucket ] = setTimeout( fn, delay );
    				
    			}
    		};
    	})();
    	
    	// create filters and add to DOM
    	(function( dtInstance, filterColumns, filterTR ) {
    		
    		$( filterColumns ).each(function ( idx, filterDefs ) {
    			
    			if( !filterDefs ) return;
    			
    			var filterOptions = $.extend({
    				
    				value: dtInstance.settings()[0].aoPreSearchCols[ idx ].sSearch,
    				label: $( dtInstance.columns( idx ).header()[0] ).text()
    				
    			}, filterDefs);
    			
    			var filter = new Filter.factory( 
    					filterDefs.type,
    					filterOptions,
    					{
    	    				onValueChanged: function( newValue, oldValue ) {
    	    					
    	    					// TODO: these must go somewhere to a default options obejct but not here
    	    					var regex = true;
    	    					var isSmart = false;
    	    					var isCaseInsensative = true;
    	    					
    	    					Timer.queue( "FILTER_TYPE_TEXT", function () {
    	    						
    	    						dtInstance.columns( idx ).search( newValue, regex, isSmart, isCaseInsensative ).draw();
    	    						
    	    					}, 1000);
    	    		        	
    	    				}
    	    			});
    			$( filterTR[0].cells[ idx ] ).append( filter.DOMElem );
                
    		});
    		
    		/*
    		var filterValue = _dtInstance.settings()[0].aoPreSearchCols[ idx ].sSearch;
            if (filterValue != '' && filterValue != '^') {
                if (filterValue.charAt(0) == '^') {
                	filterValue = filterValue.substr(1);
                } else {
                	filterValue = filterValue;
                }
            }
            */
    		
    	})( _dtInstance, options.filterColumns, _filterElem );
    	
    	return {
    		/**
    		 * This will update the columnFilters give a new set of options.
    		 * Typically good when the column definitions change and the filters 
    		 * need to reflect the current state.
    		 */
    		updateFilters( newOptions ) {
    			
    			// TODO
    			
    		}
    	}
    };
    
    // We do not support the older API
    //$.fn.DataTable.Filtering = $.fn.dataTable.Filtering;

})(jQuery);
