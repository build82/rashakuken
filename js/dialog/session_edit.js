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
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/on',
	'dojo/topic',
	'build82/config',
	'build82/dialog/setup',
	'build82/history'
	], 
    function(dom, domConstruct, on, topic, Config, Setup, History) {
		var static = {
			linkParent: 'container-session_save',
			focus: 'dialog-session_edit',
			entropyLength: 4
		},
				
		handleHide = function() {
			topic.publish(Config.Topic.Focus, 'pop', {interface:static.focus});
		},
				
		handleShow = function() {
			topic.publish(Config.Topic.Focus, 'push', {interface:static.focus, title:'Save Session', alias:'session/save'});
		},
				
		handleRestore = function(param_obj) {
			if(!Setup.Get('session_persist')) {
				return;
			}
			
			dom.byId('session_edit_distance').value = param_obj.meta.distance;
			dom.byId('session_edit_pre_action').value = param_obj.meta.action_pre;
			
			dom.byId('session_edit_player_threat').value = param_obj.player.threat;
			dom.byId('session_edit_player_cornered').checked = param_obj.player.cornered;
			dom.byId('session_edit_player_health').value = param_obj.player.health;
			dom.byId('session_edit_player_shadow').value = param_obj.player.shadow;
			dom.byId('session_edit_player_instinct').checked = param_obj.player.instinct.available;
			dom.byId('session_edit_player_i_active').checked = param_obj.player.instinct.active;
			dom.byId('session_edit_opponent_action').value = param_obj.opponent.action;
			dom.byId('session_edit_opponent_fighter').value = param_obj.opponent.fighter;
			dom.byId('session_edit_opponent_cornered').checked = param_obj.opponent.cornered;
			dom.byId('session_edit_opponent_health').value = param_obj.opponent.health;
			dom.byId('session_edit_opponent_shadow').value = param_obj.opponent.shadow;
			dom.byId('session_edit_opponent_instinct').checked = param_obj.opponent.instinct.available;
			dom.byId('session_edit_opponent_i_active').checked = param_obj.opponent.instinct.active;
		},
		
		retrieveData = function() {
			// prepare data
			var data_obj = {
				meta: {
					distance: dom.byId('session_edit_distance').value,
					action_pre: dom.byId('session_edit_pre_action').value,
					action_post: null
				},
				player: {
					fighter: 'omen',
					threat: dom.byId('session_edit_player_threat').value,
					cornered: +dom.byId('session_edit_player_cornered').checked,
					health: dom.byId('session_edit_player_health').value,
					shadow: dom.byId('session_edit_player_shadow').value,
					instinct: {
						value: null,
						available: +dom.byId('session_edit_player_instinct').checked,
						active: +dom.byId('session_edit_player_i_active').checked
					}
				},
				opponent: {
					fighter: dom.byId('session_edit_opponent_fighter').value,
					action: dom.byId('session_edit_opponent_action').value,
					cornered: +dom.byId('session_edit_opponent_cornered').checked,
					health: dom.byId('session_edit_opponent_health').value,
					shadow: dom.byId('session_edit_opponent_shadow').value,
					instinct: {
						value: null,
						available: +dom.byId('session_edit_opponent_instinct').checked,
						active: +dom.byId('session_edit_opponent_i_active').checked
					}
				}
			};
			
			return data_obj;
		},
				
		saveState = function() {
			topic.publish(Config.Topic.Session, 'persist', {persist:{session:retrieveData()}});
		},
		
		exportSession = function() {
			// empty link location
			domConstruct.empty(static.linkParent);
			
			// prepare data
			var data_obj = Object.assign({}, Object.assign(retrieveData(), {
				rasha: History.Get()
			}));
			
			// strip marks?
			if(!Setup.Get('export_marks')) {
				for(var rasha in data_obj.rasha) {
					delete data_obj.rasha[rasha].marked;
				}
			}
			
			// generate filename
			var currentDate = new Date();
			var fileEntropy_str = '' + currentDate.getFullYear() + (currentDate.getMonth()+1) + currentDate.getDate() + '_' + Math.random().toString(36).substr(2, static.entropyLength);
			
			// create virtual file
			var downloadLink = document.createElement('a');
			var data_file = new Blob([JSON.stringify(data_obj)], {type:'application/json'});
			downloadLink.href = URL.createObjectURL(data_file);
			downloadLink.download = 'omen_rasha_' + fileEntropy_str + '.json';
			dom.byId(static.linkParent).appendChild(downloadLink);
			
			// open save file dialog
			downloadLink.click();
			URL.revokeObjectURL(downloadLink.href);
			dom.byId(static.linkParent).removeChild(downloadLink);
			delete downloadLink;
			
			handleHide();
		};
			
		return {
			Init: function() {
				on(dom.byId('nav_session_edit'), 'click', handleShow);
				on(dom.byId('session_edit_cancel'), 'click', handleHide);
				on(dom.byId('session_edit_submit'), 'click', exportSession);
				on(dom.byId('dialog-session_edit'), 'change', saveState);
				
				topic.subscribe(Config.Topic.Session, function(command, obj) {
					switch(command) {
						case 'restore' :
							handleRestore(obj.session);
							break;
					}
				});
				
				topic.subscribe(Config.Topic.Setup, function(command, obj) {
					switch(command) {
						case 'persist' :
							if(obj.persist.setup['setup_session_persist']) {
								saveState();
							}
							break;
					}
				});
			}
		};
	}
);