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
	],
    function() {
		return {
			siteTitle: 'Rashakuken Stats',
			stateName: 'b82_rasha_appstate',
			Rasha: {
				accel: {name:'Accelerator', icon:'double_arrow', color:'#365b7b'},
				aair: {name:'Anti-Air', icon:'airplanemode_inactive', color:'#b35f1d'},
				boom: {name:'Boomerang', icon:'360', color:'#a63d44'},
				bullet: {name:'Bullet', icon:'bolt', color:'#558680'},
				crawl: {name:'Crawler', icon:'bug_report', color:'#427638'},
				dec: {name:'Decelerator', icon:'last_page', color:'#ae8c32'},
				dud: {name:'Dud', icon:'anchor', color:'#7f5877'},
				loop: {name:'Looper', icon:'loop', color:'#ba707c'},
				track: {name:'Tracker', icon:'my_location', color:'#725244'},
				wave: {name:'Wave', icon:'waves', color:'#877f7d'},
				wig: {name:'Wiggler', icon:'all_inclusive', color:'#364755'}
			},
			Menu: [
				{url:'https://www.twitch.tv/crazyskatenate_ki', name:'CrazySkateNate_KI - Twitch', description:'"Over the top, high level play!" The best in Omen tech, live-streamed + hours of video content.'},
				{url:'https://www.twitch.tv/unclescarscar808', name:'Unclescarscar808 - Twitch', description:'The KI Classroom. Ask questions, get answers... edge cases & fringe facts.'},
				{url:'https://ki.infil.net/omen.html', name:'Omen: The Complete KI Guide by Infil', description:'The de facto Omen breakdown & beginner\'s guide.'},
				{url:'https://killerinstinct.fandom.com/wiki/Omen/', name:'Omen | Killer Instinct Wiki | Fandom', description:'Omen character attributes, lore, & more.'}
			],
			Topic: {
				Setup: 'topic_setup',
				Rasha: 'topic_rasha',
				Recorder: 'topic_recorder',
				Menu: 'topic_menu',
				Focus: 'topic_focus',
				Session: 'topic_session'
			}
		};
	}
);