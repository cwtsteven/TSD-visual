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

	searchForPromoOrMod() {
		if (this instanceof Promo)
			return this;
		else if (this instanceof Mod || this instanceof Inter)
			return this;
		else if (this instanceof If1)
			return this.graph.findNodeByKey(this.findLinksOutOf("n")[0].to).searchForPromoOrMod();
		else if (this instanceof If2)
			return this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to).searchForPromoOrMod();
		else if (this instanceof Contract || this instanceof Pax)
			return this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to).searchForPromoOrMod();
	}

	unFolding(map, mod) {
		var next = this.searchForPromoOrMod();
		if (next instanceof Promo || next.parents.indexOf(mod.key) != -1) {
			var promo = next.searchForPromo();
			var newBoxWrapper = promo.group.copyBox(map).addToGroup(mod.group);
			for (let aux of promo.group.auxs) {
				var newBoxPrin = aux.unFolding(map, mod);
				new Link(map.get(aux.key), newBoxPrin.key, "n", "s").addToGroup(mod.group);
			}
			return newBoxWrapper.prin;
		}
		else {
			return next.shallowUnfolding(mod.group);
		}
	}

	deepUnfolding(mod) {
		var map = new Map();
		return this.unFolding(map, mod);
	}

	shallowUnfolding(group) {
		var con = new Contract(this.name).addToGroup(group);
		new Link(con.key, this.key, "n", "s").addToGroup(group);
		return con;
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