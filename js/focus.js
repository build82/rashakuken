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
	'dojo/aspect',
	'dojo/_base/fx',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/topic',
	'build82/config'
	], 
    function(aspect, baseFx, dom, domClass, topic, Config) {
		var static = {
			location: '/',
			focus: []
		},
				
		handleHide = function(id) {
			if(!dom.byId(id)) { return; }
			
			var hide_ani = baseFx.fadeOut({
				node: dom.byId(id),
				duration: 100
			});
			
			aspect.after(hide_ani, 'onEnd', function() {
				domClass.add(id, 'hidden');
				topic.publish(Config.Topic.Focus, 'hidden');
			});
			hide_ani.play();
		},
				
		handleShow = function(id) {
			if(!dom.byId(id)) { return; }
			domClass.remove(id, 'hidden');

			// fade in content
			var show_ani = baseFx.fadeIn({ 
				node: dom.byId(id),
				duration: 100
			});
					
			aspect.after(show_ani, 'onEnd', function() {
				topic.publish(Config.Topic.Focus, 'live', static.focus[static.focus.length-1]);
			});
			show_ani.play();
		},
			
		handlePop = function() {
			topic.publish(Config.Topic.Focus, 'pop', static.focus[static.focus.length-1]);
		},
				
		handleLocation = function(param_prefix) {
			static.location = param_prefix;
		},
				
		setBrowserState = function(param_title, param_alias) {
			document.title = Config.siteTitle + (param_title?' - '+param_title:'');
			window.history.pushState({}, document.title, static.location + param_alias);
		};
				
		return {
			Init: function(start) {
				topic.subscribe(Config.Topic.Focus, function(command, data) {
					switch(command) {
						case 'push' :
							if(static.focus[static.focus.length-1].interface === data.interface) {
								break;
							}
							
							handleHide(static.focus[static.focus.length-1].interface);
							static.focus.push(data);
							setBrowserState(data.title, data.alias);
							break;
						case 'pop' :
							if(static.focus.length === 1) {
								// exit application
								history.back();
								return; 
							}
							for(var pop = static.focus.pop(); pop.interface !== data.interface; pop = static.focus.pop()) {
								handleHide(pop.interface);
							}
							
							handleHide(pop.interface);
							var top = static.focus[static.focus.length-1];
							setBrowserState(top.title, top.alias);
							break;
						case 'pause' :
							for(var i = 0; i < static.focus.length; i++) {
								domClass.add(static.focus[i].interface, 'hidden');
							}
							break
						case 'hidden' :
						case 'resume' :
							handleShow(static.focus[static.focus.length-1].interface);
							break
					}
				});
				
				// start focus
				static.focus.push({interface:start, alias:''});
				window.onpopstate = this.HandlePop;
				window.history.replaceState({}, Config.siteTitle, static.location);
				topic.publish(Config.Topic.Focus, 'resume');
			},
			
			HandlePop: handlePop,
			Location: handleLocation
		};
	}
);