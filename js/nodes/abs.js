define(function(require) {
	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var App = require('nodes/app');
	var Expo = require('nodes/expo');	
	var PatTuple = require('nodes/pattuple');
	var Pair = require('token').Pair();

	class Abs extends Node {

		constructor() {
			super(null, "λ", "yellow");
		}
		
		transition(token, link) {
			if (link.to == this.key && link.toPort == "s") {
				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				var data = token.dataStack.last();
				if (data == CompData.PROMPT && !(prev instanceof App)) {
					token.dataStack.pop();
					token.dataStack.push(new Pair(CompData.LAMBDA,CompData.EMPTY));
					token.forward = false;
					return link;
				}
				else if (data == CompData.PROMPT && prev instanceof App) {
					var nextLink = this.findLinksOutOf(null)[0];
					token.dataStack.pop();
					token.rewriteFlag = RewriteFlag.F_LAMBDA;
					return nextLink; 
				}
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_LAMBDA && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				if (prev instanceof App) {
					// M rule
					var appLink = prev.findLinksInto(null)[0];
					var appOtherLink = prev.findLinksOutOf("e")[0];
					var otherNextLink = this.findLinksInto("w")[0];

					nextLink.changeFrom(appLink.from, appLink.fromPort);
					nextLink.changeToGroup(appLink.group);
					
					otherNextLink.changeTo(appOtherLink.to, appOtherLink.toPort);
					otherNextLink.reverse = false;

					var otherNode = this.graph.findNodeByKey(otherNextLink.from);
					if (otherNode instanceof Expo || otherNode instanceof PatTuple) 
						otherNextLink.fromPort = "n";
					otherNextLink.changeToGroup(appOtherLink.group);
					
					this.delete();
					prev.delete();
				}
					
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Abs();
		}
	}

	return Abs;
});