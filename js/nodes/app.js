define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Expo = require('nodes/expo');	
	var PatTuple = require('nodes/pattuple');
	var Pair = require('token').Pair();


	class App extends Node {

		constructor() {
			super(null, "@","yellow");
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "e") {
				var nextLink = this.findLinksOutOf("w")[0];
				token.dataStack.pop();
				token.dataStack.push(CompData.PROMPT);
				token.forward = true;
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "w") {
				var nextLink = this.findLinksInto()[0];
				token.dataStack.pop();
				token.dataStack.push(CompData.PROMPT);
				token.rewriteFlag = RewriteFlag.F_APP;
				return nextLink; 
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_APP && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY; 

				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				var right = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);
				
				var oldGroup = left.group;
				oldGroup.moveOut(); // this.group is a box-wrapper
				oldGroup.deleteAndPreserveLink(); 
				
				var lambda = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);

				var appLink = this.findLinksInto(null)[0];
				var rightLink = this.findLinksOutOf("e")[0];
				var leftLink = lambda.findLinksInto("w")[0];
				var lamdaout = lambda.findLinksOutOf("e")[0];

				lamdaout.changeFrom(appLink.from, appLink.fromPort);
				lamdaout.changeToGroup(appLink.group);
				
				leftLink.changeTo(rightLink.to, rightLink.toPort);
				leftLink.reverse = false;

				var otherNode = this.graph.findNodeByKey(leftLink.from);
				if (otherNode.findLinksOutOf().length == 1) 
					leftLink.fromPort = "n";
				leftLink.changeToGroup(rightLink.group);
				
				lambda.delete();
				this.delete();
			
					
				token.rewrite = true;
				token.forward = true;
				return lamdaout;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new App();
		}
	}

	return App;
});