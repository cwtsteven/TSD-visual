var showKey = false;

class Node {

	constructor(shape, text, name) {
		this.key = null;
		this.shape = shape;
		this.text = text;
		this.name = name; // identifier name or constant name if any
		this.graph = null;
		this.group = null;
		this.width = null;
		this.height = null;
		this.links = [];
		this.addToGraph(graph); // cheating!
	}

	addToGraph(graph) {
		if (graph != null)
			graph.addNode(this);
		this.graph = graph;
		return this; // to provide chain operation
	}

	addToGroup(group) {
		group.addNode(this);
		this.group = group;
		return this; // to provide chain operation
	}

	changeToGroup(group) {
		this.group.removeNode(this);
		this.addToGroup(group);
		return this;
	}

	findLinksConnected() {
		return this.links;
	}

	findLinksInto(toPort) {
		var links = [];
		for (let link of this.links) {
			if (link.to == this.key && (toPort == null ? true : link.toPort == toPort))
				links.push(link);
		}
		return links;
	}

	findLinksOutOf(fromPort) {
		var links = [];
		for (let link of this.links) {
			if (link.from == this.key && (fromPort == null ? true : link.fromPort == fromPort))
				links.push(link);
		}
		return links;
	}

	searchForPromo() {
		if (this instanceof Promo)
			return this;
		else if (this instanceof Mod || this instanceof Inter)
			return this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to).searchForPromo();
		else if (this instanceof If1)
			return this.graph.findNodeByKey(this.findLinksOutOf("n")[0].to).searchForPromo();
		else if (this instanceof If2)
			return this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to).searchForPromo();
		else if (this instanceof Contract)
			return this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to).searchForPromo();
	}

	searchForPromoFromMod(mod) {
		if (this instanceof Promo)
			return null;
		else if (this instanceof Mod || this instanceof Inter) {
			console.log(this.parents);
			if (this.parents.indexOf(mod.key) != -1)
				return this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
			else
				return null;
		}
		else if (this instanceof If1)
			return this.graph.findNodeByKey(this.findLinksOutOf("n")[0].to).searchForPromoFromMod(mod);
		else if (this instanceof If2)
			return this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to).searchForPromoFromMod(mod);
		else if (this instanceof Contract)
			return this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to).searchForPromoFromMod(mod);
		else if (this instanceof Pax)
			return this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to).searchForPromoFromMod(mod);
	}

	unFolding(map, mod, boxWrapper) {
		var newBoxWrapper = boxWrapper.copyBox(map).addToGroup(mod.group);
		for (let aux of boxWrapper.auxs) {
			var promo = aux.searchForPromoFromMod(mod);
			if (promo != null) {
				var newBox2 = aux.unFolding(map, mod, promo.group, mod.group);
				new Link(map.get(aux.key), newBox2.prin.key, "n", "s").addToGroup(mod.group);
			}
			else {
				var con = new Contract(aux.name).addToGroup(mod.group);
				var auxLink = aux.findLinksOutOf(null)[0];
				auxLink.changeFrom(con.key, "n");
				new Link(aux.key, con.key, "n", "s").addToGroup(mod.group);
				new Link(map.get(aux.key), con.key, "n", "s").addToGroup(mod.group);
			}
		}
		return newBoxWrapper;
	}

	deepUnfolding(mod) {
		var firstPromo = this.searchForPromo();
		var map = new Map();
		return this.unFolding(map, mod, firstPromo.group);
	}

	copy(graph) {
		var newNode = new Node(this.shape, this.text, this.name).addToGraph(graph);
		newNode.width = this.width;
		newNode.height = this.height;
	}	

	// also delete any connected links
	delete() {
		this.group.removeNode(this);
		this.graph.removeNode(this);
	}

	draw(level) {
		var str = level + this.key + '[label="' + this.text; 
		if (showKey)
			str += ':' + this.key;
		str += '"';
		if (this.shape != null)
			str += ',shape=' + this.shape;
		if (this.width != null)
			str += ',width=' + this.width;
		if (this.height != null)
			str += ',height=' + this.height;
		return str += '];'
	}

	// machine instructions
	transition(token, link) {
		return link;
	}

	rewrite(token, nextLink) {
		token.rewrite = false;
		return nextLink;
	}

	analyse(token) {
		return this.findLinksInto('s')[0];
	}

	propagate(token) {
		return this.findLinksInto('s')[0];
	}
}