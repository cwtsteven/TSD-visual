define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var PatternType = require('ast/pattern');
	var Contract = require('nodes/contract');
	var PatTuple = require('nodes/pattuple');
	var Term = require('term');
	var Weak = require('nodes/weak');
	var Pair = require('token').Pair();

	class PairNode extends Node {

		constructor() {
			super(null, ",", "mediumpurple1");
		}
		
		transition(token, link) {
			console.log("pair-trans");
			if (link.to == this.key) {
				var nextLink;
				if (token.dataStack.last() == CompData.PR) {
					token.dataStack.pop();
					nextLink = this.findLinksOutOf("e")[0]; 
				}
				else if (token.dataStack.last() == CompData.PL) {
					token.dataStack.pop()
					nextLink = this.findLinksOutOf('w')[0];
				}
				else {
					token.dataStack.push(CompData.PE);
					token.dataStack.push(CompData.PROMPT); 
					nextLink = this.findLinksOutOf("e")[0]; ;
				}
				token.rewriteFlag = RewriteFlag.F_PAIR;
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "e") {
				var nextLink;
				if (token.dataStack[token.dataStack.length-2] == CompData.PE) {
					nextLink = this.findLinksOutOf("w")[0];
					token.dataStack.push(CompData.PROMPT);
					token.forward = true;
				}
				else {
					nextLink = this.findLinksInto("s")[0];
					token.dataStack.push(CompData.PR);
					token.forward = false;
				}
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "w") {
				if (token.dataStack[token.dataStack.length-3] == CompData.PE) {
					var l = token.dataStack.pop();
					var r = token.dataStack.pop();
				 			token.dataStack.pop();
				 			token.dataStack.pop();
				 	var result = new Pair(l.a,r.a);
				 	var type = (l.b == CompData.EMPTY && r.b == CompData.EMPTY) ? CompData.EMPTY : CompData.DEP;
					token.dataStack.push(new Pair(result,type));
				}	
				else {
					token.dataStack.push(CompData.PL); 
				}
				return this.findLinksInto(null)[0];;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_PAIR && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);

				if (prev instanceof Contract) {
					if (nextLink.from == this.key) {
						var link = token.boxStack.pop();
						var inLinks = prev.findLinksInto(null);
						if (inLinks.length == 1) { 
							// this will not happen as the C-node should have taken care of it
							link.changeTo(this.key, "s");
							prev.delete();
						}
						else {
							var leftArm = this.findLinksOutOf('w')[0];
							var left = this.graph.findNodeByKey(leftArm.to);
							var rightArm = this.findLinksOutOf('e')[0];
							var right = this.graph.findNodeByKey(rightArm.to);
							var newPair = new PairNode().addToGroup(this.group);
							var conL = new Contract(left.name).addToGroup(this.group);
							var conR = new Contract(right.name).addToGroup(this.group);
							leftArm.changeTo(conL.key, "s");
							rightArm.changeTo(conR.key, "s");
							new Link(conL.key, left.key, "n", "s").addToGroup(leftArm.group);
							new Link(conR.key, right.key, "n", "s").addToGroup(rightArm.group);
							new Link(newPair.key, conL.key, "w", "s").addToGroup(newPair.group);
							new Link(newPair.key, conR.key, "e", "s").addToGroup(newPair.group);
							var prevLink = prev.findLinksOutOf(null)[0];
							prevLink.changeTo(newPair.key, "s");
							link.changeTo(this.key, "s"); 
						}
						token.rewriteFlag = RewriteFlag.F_PAIR;
						token.rewrite = true;
						return nextLink;
					}
				}			

				else if (prev instanceof PatTuple) {
					this.findLinksOutOf("e")[0].changeFrom(prev.findLinksInto("e")[0].from, prev.findLinksInto("e")[0].fromPort);
					this.findLinksOutOf("w")[0].changeFrom(prev.findLinksInto("w")[0].from, prev.findLinksInto("w")[0].fromPort);
					this.delete();
					prev.delete();
					token.rewrite = true;
					return nextLink;
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
			return new PairNode();
		}
	}

	return PairNode;
});