define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var App = require('nodes/app');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var Contract = require('nodes/contract');
	var Param = require('nodes/param');
	var ProvCon = require('nodes/pc');
	var Cell = require('nodes/cell');
	var Pair = require('token').Pair(); 

	class Fuse extends Node {

		constructor(pname) {
			super(null, "F("+pname+")","indianred1");
			this.updatePName(pname);
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
					token.rewriteFlag = RewriteFlag.F_FUSE;
					return nextLink; 
				}
			}
		} 

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_FUSE && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				if (prev instanceof App) {
					// M rule
					var appLink = prev.findLinksInto(null)[0];
					var appOtherLink = prev.findLinksOutOf("e")[0];
					var otherNextLink = this.findLinksInto("w")[0];


					// fuse
					var root = this.graph.findNodeByKey(appOtherLink.to);
					var vec = this.fuse(root);
					var con = new Contract().addToGroup(prev.group);
					new Link(con.key, appOtherLink.to, "n", appOtherLink.toPort).addToGroup(prev.group);
					appOtherLink.changeTo(vec.key, "s");

					nextLink.changeFrom(appLink.from, appLink.fromPort);
					nextLink.changeToGroup(appLink.group);
					
					otherNextLink.changeTo(appOtherLink.to, appOtherLink.toPort);
					otherNextLink.reverse = false;

					var otherNode = this.graph.findNodeByKey(otherNextLink.from);
					if (otherNode.findLinksOutOf().length == 1) 
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

		fuse(node) { 
			var nodes = [node];
			var visitedCell = []; 
			var target = []; 
			while (nodes.length != 0) {
				var node = nodes.pop();

				if (node instanceof ProvCon) { 
					if (target.indexOf(node.key) == -1) 
						target.push(node.key); 
				}
				else if (node instanceof Promo) {
					nodes = nodes.concat(node.group.auxs);
				}
				else if (node instanceof Cell) {
					if (visitedCell.indexOf(node.key) == -1) {
						nodes.push(this.graph.findNodeByKey(node.findLinksOutOf(null)[0].to));
						visitedCell.push(node.key);
					}
				}
				else {
					var newNodes = [];
					var links = node.findLinksOutOf(null);
					links.forEach(function(link) {
						newNodes.push(node.graph.findNodeByKey(link.to));
					});
					nodes = nodes.concat(newNodes); 
				}
			}

			var vec = new Param(this.pname).addToGroup(this.group);
			//var con = new Contract().addToGroup(this.group);
			//new Link(con.key, vec.key, "n", "s").addToGroup(this.group);
			target.forEach(function(key) {
				var node = vec.graph.findNodeByKey(key); 
				var prev = node.graph.findNodeByKey(node.findLinksInto(null)[0].from);
				if (prev instanceof Contract) {
					new Link(vec.key, prev.key, "n", "s").addToGroup(vec.group);
				}
				else {
					var con = new Contract().addToGroup(vec.group);
					new Link(con.key, node.key, "n", "s").addToGroup(vec.group); 
					node.findLinksInto(null)[0].changeTo(con.key,"s");
					//if (node instanceof ProvCon) {
						//var c = new Const(node.data).addToGroup(vec.group);
						new Link(vec.key, con.key, "n", "s").addToGroup(vec.group);					
						//node.delete(); 
					//}
				}
			});			

			return vec;
		}
		
		updatePName(pname) {
			this.pname = pname;
			this.text = "F("+pname+")";
		}

		copy() {
			return new Fuse(this.pname);
		}
	}

	return Fuse;
});