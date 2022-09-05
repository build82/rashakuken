/* 
 * Copyright Notice 
 * 
 * COPYRIGHT© 2021 Build 82. All rights reserved. No part of this software
 * and constituent code may be reproduced in any form, including video recording, 
 * photocopying, downloading, broadcasting or transmission electronically, without 
 * prior written consent of Build 82. Copyright protection includes output
 * generated by this software as displayed in print or in digital form, such as 
 * icons, interfaces, and the like. 
 * 
 * Content Warranty 
 * 
 * The information in this document is subject to change without notice. THIS 
 * DOCUMENT IS PROVIDED "AS IS" AND BUILD 82 MAKES NO WARRANTY, EXPRESS, 
 * IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO ALL WARRANTIES OF 
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE OR NONINFRINGEMENT. 
 * Build 82 shall not be liable for errors contained herein or for 
 * incidental or consequential damages in connection with the furnishing, 
 * performance or use of this material.
 */	

define([
	'dojo/query',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/on',
	'dojo/topic',
	'build82/config',
	'build82/focus',
	'build82/history',
	'build82/dialog/session_clear',
	'build82/dialog/session_edit',
	'build82/dialog/setup',
	'build82/d3/bar_sort',
	'build82/d3/bar_horiz_sort',
	'build82/d3/chord_dep',
	'build82/d3/chord_dep'
	], 
    function(query, dom, domConstruct, domClass, on, topic,
		Config, Focus, History, SessionClear, SessionEdit, Setup, BarChart, BarHorizChart, ChordDependency) {
		var config = {
			selectID_str: 'container-rasha_select',
			selectTemplate: '<i title="#TITLE#" class="rasha" data-type="#TYPE#" style="color:#COLOR#;"><i class="material-icons">#ICON#</i><div><b></b><b></b><b></b><b></b></div></i>',
		},
		static = {
			rasha: [],			// selected rasha
			follow: null,
			lastRasha: null,
			chiSquared: 0,
			count: {
				type: {},
				order: [0,0,0,0],
				rasha: {0:{}, 1:{}, 2:{}, 3:{}}
			},
			chart: {
				observer: [],
				main: null,
				chord: null,
				chi: null,
				rasha: {}
			},
			persist: {}			// key -> value store for module data
		},
				
		saveState = function(param_persist) {
			static.persist = Object.assign(static.persist, param_persist || {});
			var state = {
				setup: Setup.Get(),
				history: History.Get(),
				count: static.count,
				follow: static.follow,
				last: static.lastRasha,
				chiSquared: static.chiSquared,
				persist: static.persist
			};
					
			localStorage.setItem(Config.stateName, JSON.stringify(state));
		},
		
		restoreState = function() {
			var state = JSON.parse(localStorage.getItem(Config.stateName));
			if(state) {
				History.Init(state.history);
				static.count = state.count;
				static.follow = state.follow;
				static.lastRasha = state.last;
				static.chiSquared = state.chiSquared;
				static.persist = state.persist || {};
			}
		},
				
		rashaFactory_Select = function(param_type) {
			return config.selectTemplate.
				replace('#TYPE#', param_type).
				replace('#TITLE#', Config.Rasha[param_type].name).
				replace('#COLOR#', Config.Rasha[param_type].color).
				replace('#ICON#', Config.Rasha[param_type].icon);
		},
				
		addChartObserver = function(param_ele, param_chart) {
			static.chart.observer.push({chart:param_chart, element:param_ele});
		},
		
		handleChartRedraw = function() {
			for(const obs of static.chart.observer) {
				obs.chart.redraw(obs.element.offsetHeight, obs.element.offsetWidth);
				obs.chart.update({});
			}
		},
		
		initProbDist = function() {
			var probDistNode = dom.byId('history_prob_dist');
			domConstruct.empty(probDistNode);
			static.chart.main = new BarChart({
				width: probDistNode.offsetWidth,
				height: probDistNode.offsetHeight,
				yDomainDefault: [0, 100],
				data: static.count.type,
				colors: Object.values(Config.Rasha).map(i=>i.color),
				format: {
					title: t => Config.Rasha[t].icon,
					tooltip: t => Config.Rasha[t].name,
					value: t => t.toFixed(3)+'%'
				},
				compute: function(param_data) {
					var data_ary = [];
					var historyLength_int = History.Get().length;
					for(var orb in Config.Rasha) {
						data_ary.push({
							name: orb,
							value: param_data[orb] ? param_data[orb] / historyLength_int * 100 : 0
						});
					}
					return data_ary;
				}
			});
			domConstruct.place(static.chart.main.domNode, probDistNode, 'last');
			addChartObserver(probDistNode, static.chart.main);
		},
				
		initProbRasha = function(param_order) {
			var probDistNode = dom.byId('prob-rasha_'+(param_order+1));
			domConstruct.empty(probDistNode);
			static.chart.rasha[param_order] = new BarChart({
				width: probDistNode.offsetWidth,
				height: probDistNode.offsetHeight,
				margin: {top: 12, right: 10, bottom: 25, left: 30},
				yDomainDefault: [0, 100],
				data: static.count.rasha[param_order],
				colors: Object.values(Config.Rasha).map(i=>i.color),
				format: {
					title: t => Config.Rasha[t].icon,
					tooltip: t => Config.Rasha[t].name,
					value: t => t.toFixed(3)+'%'
				},
				compute: function(param_data) {
					var data_ary = [];
					for(var orb in Config.Rasha) {
						data_ary.push({
							name: orb,
							value: param_data[orb] ? param_data[orb] / static.count.order[param_order] * 100 : 0
						});
					}
					return data_ary;
				}
			});
			domConstruct.place(static.chart.rasha[param_order].domNode, probDistNode, 'last');
			addChartObserver(probDistNode, static.chart.rasha[param_order]);
		},
				
		initFollowMatrix = function() {
			return Array.from(Object.keys(Config.Rasha), () => new Array(Object.keys(Config.Rasha).length).fill(0));
		},
				
		initChordDiagram = function() {
			var chordNode = dom.byId('history_follow_chord');
			domConstruct.empty(chordNode);
			static.chart.chord = new ChordDependency({
				width: chordNode.offsetWidth,
				height: chordNode.offsetHeight,
				names: Object.keys(Config.Rasha),
				data: static.follow,
				colors: Object.values(Config.Rasha).map(i=>i.color),
				format: {
					title: t => Config.Rasha[t].icon,
					tooltip: t => Config.Rasha[t].name
				}
			});
			domConstruct.place(static.chart.chord.domNode, chordNode, 'last');
			addChartObserver(chordNode, static.chart.chord);
		},
				
		initChiSquared = function() {
			var chiNode = dom.byId('history_chi_squared');
			domConstruct.empty(chiNode);
			static.chart.chi = new BarHorizChart({
				width: chiNode.offsetWidth,
				height: chiNode.offsetHeight,
				margin: {top: 5, right: 10, bottom: 20, left: 25},
				xDomainDefault: [0, 30],
				colors: ['#574a73'],
				data: static.chiSquared || 0,
				format: {
					title: t => t,
					tooltip: t => t,
					value: t => t.toFixed(3)
				},
				compute: function(param_data) {
					return [{name:'χ2', value:param_data}];
				}
			});
			domConstruct.place(static.chart.chi.domNode, chiNode, 'last');
			addChartObserver(chiNode, static.chart.chi);
		},
				
		initCharts = function() {
			initProbDist();
			initProbRasha(0);
			initProbRasha(1);
			initProbRasha(2);
			initProbRasha(3);
			static.follow = static.follow || initFollowMatrix();
			initChordDiagram();
			initChiSquared();
		},
				
		updateCharts = function() {
			static.chart.main.update({data:static.count.type});
			static.chart.chord.update({data:static.follow});
			static.chart.chi.update({data:static.chiSquared});
			for(var orderChart in static.chart.rasha) {
				static.chart.rasha[orderChart].update({data:static.count.rasha[orderChart]});
			}
		},
				
		calculateChartData = function(param_rasha) {
			// track follow
			if(static.lastRasha) {
				var rashaTypes_ary = Object.keys(Config.Rasha);
				static.follow[rashaTypes_ary.indexOf(static.lastRasha.type)][rashaTypes_ary.indexOf(param_rasha.type)]++;
			}
			
			// init chi squared
			var chiSum_dbl = 0;
			
			const expectation_dbl = History.Get().length/11;
			for(var type in Config.Rasha) {
				// calculate chi squared
				chiSum_dbl += Math.pow((static.count.type[type]||0)-expectation_dbl, 2)/expectation_dbl;

				// count rasha type & order
				if(param_rasha.type===type) {
					static.count.type[type] = (static.count.type[type]||0) + 1;
					static.count.rasha[param_rasha.order][type] = (static.count.rasha[param_rasha.order][type]||0) + 1;
					static.count.order[param_rasha.order] = (static.count.order[param_rasha.order]||0) + 1;
				}
			}
			
			// set new last rash for follow
			static.chiSquared = chiSum_dbl;
			static.lastRasha = param_rasha;
		},
				
		handleMarkRasha = function(param_evt) {
			var target = param_evt.srcElement.parentElement;
			if(!domClass.contains(target, 'rasha')) {
				return;
			}
			
			var history_obj = History.Mark(target.attributes['data-index'].value);
			
			if(history_obj.marked) {
				domClass.add(target, 'marked');
			}
			else {
				domClass.remove(target, 'marked');
			}
			
			topic.publish(Config.Topic.Rasha, 'mark', {rasha:history_obj});
		},
				
		handleSelectRasha = function(param_evt) {
			if(static.rasha.length === 4) {
				static.rasha.shift();
			}
			
			static.rasha.push(param_evt.currentTarget.attributes['data-type'].value);
			
			query('.recorder .rasha').removeClass('selected sel0 sel1 sel2 sel3');
			for(var orb in static.rasha) {
				var selectedOrb = query('.rasha[data-type='+static.rasha[orb]+']');
				selectedOrb.addClass('selected sel'+orb);
			}
		},
				
		handleClearRasha = function() {
			static.rasha = [];
			query('.recorder .rasha').removeClass('selected sel0 sel1 sel2 sel3');
		},
				
		handleSaveRasha = function() {
			History.Add(static.rasha);
			updateCharts();
			
			topic.publish(Config.Topic.Rasha, 'save', {});
		};
		
		return {
			Init: function() {
				// application application
				restoreState();
				initCharts();
				window.onresize = handleChartRedraw;
				Setup.Init();	
				Focus.Location('/rasha/');
				Focus.Init('rasha');
				SessionClear.Init();
				SessionEdit.Init();
				
				topic.publish(Config.Topic.Setup, 'restore', static.persist);
				topic.publish(Config.Topic.Session, 'restore', static.persist);
				
				// create selectors
				domConstruct.empty('container-rasha_select');
				for(var orb in Config.Rasha) {
					domConstruct.place(rashaFactory_Select(orb), config.selectID_str, 'last');
				}
				
				// attach behavior
				query('#container-rasha_select .rasha').on('click', handleSelectRasha);
				on(dom.byId('container-history'), 'click', handleMarkRasha);
				on(dom.byId('recorder_clear_btn'), 'click', handleClearRasha);
				on(dom.byId('recorder_save_btn'), 'click', handleSaveRasha);
				
				topic.subscribe(Config.Topic.Rasha, function(command, obj) {
					switch(command) {
						case 'save' :
							saveState(obj.persist);
							if(Setup.Get('record_clear')) {handleClearRasha();}
							break;
						case 'mark' :
							saveState(obj.persist);
							break;
						case 'calculate' :
							calculateChartData(obj.rasha);
							break;
					}
				});
				
				topic.subscribe(Config.Topic.Setup, function(command, obj) {
					switch(command) {
						// save state with setup update
						case 'persist' :
							saveState(obj.persist);
							break;
					}
				});
				
				topic.subscribe(Config.Topic.Focus, function(command, obj) {
					switch(command) {
						// save state with setup update
						case 'live' :
							if(obj.interface === 'rasha') {
								handleChartRedraw();
							}	
							break;
					}
				});
				
				topic.subscribe(Config.Topic.Session, function(command, obj) {
					switch(command) {
						// close menu on focus pop
						case 'clear' :
							static.follow = initFollowMatrix();
							static.lastRasha = null;
							static.chiSquared = 0;
							static.count = {
								type: {},
								order: [0,0,0,0],
								rasha: {0:{}, 1:{}, 2:{}, 3:{}}
							};
							History.Init([]);
							updateCharts();
							saveState();
							break
						case 'persist' :
							saveState(obj.persist);
							break;
					}
				});
			}
		};
	}
);