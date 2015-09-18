/**
* File:			jquery.dataTables.dtColumnFilter.js
* Version:		2.0
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
* IMPORTANT NOTE:
* 
* This is a re-work of the jqery.datatables.columnFilter.js originally written by
* Jovan Popovic. The original plugin is no longer supported and does not work
* with the new DT versions ( 1.10+ ). 
* 
* The original plugin by Jovan Popovic can be found here:
* http://code.google.com/p/jquery-datatables-column-filter/
* 
* This is a complete rework of the original plugin employing better Javascript practices,
* improved structure, documentation, and performance.
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
    	var _filters = (function( dtInstance, filterColumns, filterTR ) {
    		
    		var _filters = Array.apply(null, {
                length: _dtInstance.settings()[0].aoPreSearchCols.length
            }).map(function () { return null });
    		
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
    	    					
    	    					Timer.queue( "FILTER_TYPE_" + filterDefs.type, function () {
    	    						
    	    						dtInstance.columns( idx ).search( newValue, regex, isSmart, isCaseInsensative ).draw();
    	    						
    	    					}, 1000);
    	    		        	
    	    				}
    	    			});
    			$( filterTR[0].cells[ idx ] ).append( filter.DOMElem );
    			
    			_filters[ idx ] = filter;
                
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
    		
    		return _filters;
    		
    	})( _dtInstance, options.filterColumns, _filterElem );
    	
    	
    	/*
    	 * Feature to automatically sync up the filters if the DT search has been ran
    	 * outside of our universe. For example, another plugin might have triggered search.
    	 */
    	(function( dt ) {
        	
        	var _search = dt.search;
        	//dt.on( 'search.dt', function (e) {
        	dt.on( 'xhr.dt', function ( e, settings, json, xhr ) {
        		
        		var data = null;
        		
        		if( options.ajax && typeof options.ajax.dataSrc === 'function' ) {
        			
        			data = options.ajax.dataSrc( json );
        			
        		} else {
        			
        			data = json.dtColumnFilter;
        			
        		}
        		
        		if( data && data.length ) {
        			_api.updateFilters( data );
        		}
        		
        	} );
        	
        })( dtInstance );
    	
    	var _api = {
			/**
    		 * This will update the columnFilters give a new set of options.
    		 * Typically good when the column definitions change and the filters 
    		 * need to reflect the current state.
    		 * @param	filterDefs		the new options to work against
    		 */
			updateFilters: function( filterDefs ) {
    			
    			// TODO
				console.log( filterDefs );
				
	        	var isDataReloadRequired = false;
	        	$.each( filterDefs, function( idx, filterDef ) {
	        		if( !filterDef ) return;
	        		
	        		if( (filter = _filters[ idx ]) ) {
	        			
	        			var filterElem = filter.DOMElem;
	        			
	        			// TODO: check if the value in the search can be more then one member and if it used for the range filters
	        			var currentSearch = _dtInstance.columns( idx ).search();
	        			var currentColumnSearchValue = currentSearch[0] || null;
	        			
	        			// let's make sure that the value we are tryign to set the filter to is in new possible values.
	        			// for instance if we filter using the a dropdown and for whatever reason
	        			// one of the existing values is no longer existing on the backend, we
	        			// want to not only update ourselves but also re-set this filter to default
	        			if( filterDef.type === Filter.FILTER_TYPE_SELECT ) {
		        			
	        				var isCurrentValueFoundInOptions = false;
		    				for( var i = 0, len = filterDef.values.length; i < len; i++ ) {
		    					
		    					var value = filterDef.values[ i ].value;
		    					// TODO: make sure that all values default to "null" on the backend
		    					if( value == currentColumnSearchValue ) {
		    						isCurrentValueFoundInOptions = true;
		    						break;
		    					}
		    					
		    				}
		    				if( !isCurrentValueFoundInOptions ) {
		    					
		    					// reset this filter value to default ( the first value in the Array )
		    					//settings.aoPreSearchCols[ idx ].sSearch = aoColumn.values[ 0 ].value;
		    					
		    					// make sure we refetch the data to the entire table
		    					isDataReloadRequired = true;
		    					
		    					_dtInstance.columns( idx ).search( aoColumn.values[ 0 ].value );
		    					
		    				}
		    				
		    				//$( filterElem ).val( settings.aoPreSearchCols[ idx ].sSearch );
		    				
	        			} else {
	        			
		        			// set the correct value
		        			//$( filterElem ).val( settings.aoPreSearchCols[ idx ].sSearch );
		        			
	        			}
	        		};
	        		
	        	});
	        	
	        	if( isDataReloadRequired ) {
	        		
	        		//_table.DataTable().columns().search().draw();
	        		_dtInstance.draw();
	        		
	        	}
    			
    		},
    		
    		/**
    		 * A destroyer function to destroy the current instance
    		 */
    		destroy: function() {
    			
    			// TODO
    			
    		}
    	}
    	
    	return $.extend( _api, {
    		
    		// maybe we will add somethign here...
    		
    	});
    };
    
    // We do not support the older API
    //$.fn.DataTable.Filtering = $.fn.dataTable.Filtering;

})(jQuery);
