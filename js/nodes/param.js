define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var BinOpType = require('op').BinOpType;
	var Weak = require('nodes/weak');
	var Pair = require('token').Pair();

	class Param extends Node {

		constructor() {
			super(null, 'V', "mediumpurple1");
		}
		
		transition(token, link) {
			if (link.to == this.key && token.dataStack.last() == CompData.PROMPT) {
				var nextLink = this.findLinksOutOf(null).last();
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.to == this.key && token.dataStack.last().substring(0,1) == CompData.PROJ) {
				var index = parseInt(token.dataStack.last().substring(1));
				token.dataStack.push(CompData.PROMPT);
				return this.findLinksOutOf(null)[index]; 
			}
			else if (link.from == this.key && typeof(token.dataStack[token.dataStack.length-2]) == "string" 
										   && token.dataStack[token.dataStack.length-2].substring(0,1) == CompData.PROJ) {
				var data = token.dataStack.pop();
						   token.dataStack.pop();
						   token.dataStack.pop();
			    token.dataStack.push(data);
			    return this.findLinksInto(null)[0];
			}
			else if (link.from == this.key) {
				var index = this.findLinksOutOf(null).indexOf(link);
				if (index != 0) {
					var nextLink = this.findLinksOutOf(null)[index-1];
					token.dataStack.push(CompData.PROMPT);
					token.forward = true;
					return nextLink;
				}
				else {
					var data = [];
					var i;
					for (i=0;i<this.findLinksOutOf(null).length;i++) {
						data[i] = token.dataStack.pop().a;
						
					}
					token.dataStack.pop();
					token.dataStack.push(new Pair(data,CompData.DEP));
					return this.findLinksInto(null)[0]
				}
			}
		}

		copy() {
			var newNode = new Param();
			return newNode;
		}
	}

	return Param;
});