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
	
	//---------------------------------------------- Globals:
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
	});
	
	var Filter =  (function() {
			
		function Filter( id, domElement, filterDefs ) {
			this.id = id;
			this.domElement = domElement;
			
			return {
			
				id: id,
				domElement: domElement,
				
				value: function( value ) {
					
					if( value ) {
						
						this.domElement.val( value );
						return this;
						
					} else {
						
						return this.domElement.val();
						
					}
					
				},
				data: function( data ) {
				},
				destroy: function() {
				}
				
			};
		};
		
		return Filter;
	})();
	
	var FilterFactory =  (function( Filter ) {
			
		var FilterFactory = (function( Filter ) {
			
			return {
				create: function( filterDefs, options, callbacks ) {
					
					var filterConstructor = this.constructors[ filterDefs.type ];
					if( !filterConstructor ) {
						throw 'dtColumnFilter: FilterFactory: crete: no filter constructor for type "' + filterDefs.type + '"'
					}
					
					var domElement = filterConstructor( filterDefs, callbacks );
					
					var filter = new Filter( options.filterId, domElement, filterDefs );
					
					return filter;
				},
				types: {
					
				},
				constructors: {
					
				}
			};
		})( Filter );
		
		return FilterFactory;
	})( Filter );
	
	var Api = (function() {
		
		function Api( options ) {
			var data = options.data;
			
			return {
				
				data: function( newData ) {
					if( newData ) {
						data = newData;
					}
					
					for( var i = 0, len = _registry.length; i < len; i++ ) {
						
						if( (filter = _registry[i]) && (newFilterData = data[i]) ) {
							
							filter.data( newFilterData );
							
						}
						
					}
				},
				
				filters: function( idx ) {
					return idx && idx > -1 ? _registry[ idx ] : _registry;
				}
				
			};
		};
		
		return Api;
	})();
	
	$.fn.DataTable.dtColumnFilter = function ( dtInstance, options )  {
		
		//---------------------------------------------- Instance Private:
		
		var _dtInstance = dtInstance; // this must be the new 10.1+ API ( DataTable() )object and not the old ( dataTable() ) instance...
		//var _timer = new Timer();
		var _registry = new Array( dtInstance.columns()[0].length );
		var _api = new Api( options );
		
		//----------------------------------------- Init:
		var $filterRowElement = (function( dtInstance, filterColumns ) {
    		
    		var tr = "";
    		
    		tr += "<tr>";
    		for( var i = filterColumns.length; i > 0; i-- ) {
    			tr += "<th></th>";
    		}
    		tr += "</tr>";
    		
    		var $tr = $( tr );
    		$tr.addClass( "dt-columnFilters" ); // TODO: change the classname
    		
    		$( dtInstance.table().header() ).append( $tr );
    		
        	return $tr;
    		
    	})( dtInstance, options.data );
		
		(function( dtInstance, options, filterRowElement, Filter, FilterFactory ) {
			
			$( options.data ).each(function ( idx, filterDefs ) {
    			
    			if( !filterDefs ) return;
    			
				/*
    			var filterOptions = $.extend({
    				
    				value: dtInstance.settings()[0].aoPreSearchCols[ idx ].sSearch,
    				label: $( dtInstance.columns( idx ).header()[0] ).text()
    				
    			}, filterDefs);
				*/
    			var factoryOptions = {
					
					filterId: idx
					
				};
				
				var filterCallbacks = {
					onValueChanged: function( newValue, oldValue ) {
						
						var regex = filterDefs.regex;
						var isSmart = filterDefs.isSmart;
						var isCaseInsensative = filterDefs.isCaseInsensative;
						
						dtInstance.columns( idx ).search( newValue, regex, isSmart, isCaseInsensative ).draw();
						
					}
				};
				
				filterDefs.label = filterDefs.label || $( dtInstance.columns( idx ).header()[0] ).text();
				
    			var filter = FilterFactory.create( filterDefs, factoryOptions, filterCallbacks );
    			
    			_registry[ idx ] = filter;
    					
    			filterRowElement.cells[ idx ].appendChild( filter.domElement );
    			
    			_registry[ idx ] = filter;
                
    		});
			
		})( _dtInstance, options, $filterRowElement[ 0 ], Filter, FilterFactory );
		
		return _api;
	}
	
	//---------------------------------------------- Public / Extendible APIs:
		
	var extensionApi = (function( Filter, FilterFactory, Api ) {
		
		var extensionApi = {
			
			Timer: Timer,
			Filter: Filter,
			FilterFactory: FilterFactory,
			Api: Api
			
		};
		
		$.fn.DataTable.dtColumnFilter.extend = function( extendFn ) {
			
			extendFn( extensionApi );
			
		};
		
		return extensionApi;
		
	})( Filter, FilterFactory, Api );
	
})( jQuery );

(function ($) {
	$.fn.DataTable.dtColumnFilter.extend( function( dtColumnFilter ) {
	
		var _timer = new dtColumnFilter.Timer();
		
		var DEFAULT_FILTER_CSS_CLASS = "form-control";
		
		var FilterFactory = dtColumnFilter.FilterFactory;
		
		FilterFactory.types.FILTER_TYPE_TEXT = "text";
		FilterFactory.constructors[ FilterFactory.types.FILTER_TYPE_TEXT ] = function( filterDefs, callbacks ) {
			
			var defaultOptions = {
	    		cssClass: DEFAULT_FILTER_CSS_CLASS + " filter_type_input_text",
	    		label: "search...",
	    		value: "",
	    		minLength: 2,
	    		maxLength: 16
	    	};
            var effectiveFilterDefss = $.extend( defaultOptions, filterDefs );
            
            var $input = $( ''
        		+ '<input type="text" ' 
            		+ 'class="' + effectiveFilterDefss.cssClass + '" ' 
            		+ 'placeholder="' + effectiveFilterDefss.label + '" ' 
            		+ 'value="' + effectiveFilterDefss.value + '"'
        		+ '/>'
            );
            if ( effectiveFilterDefss.maxLength && effectiveFilterDefss.maxLength > 0 ) {
            	$input.attr( 'maxlength', effectiveFilterDefss.maxLength );
            }
            if ( effectiveFilterDefss.minLength && effectiveFilterDefss.minLength > 0 ) {
            	$input.data( "minlength", effectiveFilterDefss.minLength );
            }
            
            // event handlers
            $input.on( "keydown", function( e ) {
            	
            	this._$this = this._$this || $( this );
            	var oldValue = this.value || "";
            	this._$this.data( "oldValue", oldValue );
            	
            });
            $input.on( "keyup", function( e ) {
        		
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
            
            return $input[0];
		};
		
	});
})( jQuery );
