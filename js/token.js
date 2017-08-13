class MachineToken {

	constructor() {
		this.reset();
	}

	setLink(link) {
		if (this.link != null)
			this.link.clearFocus();
		this.link = link;
		if (this.link != null) {
			if (link.from == this.at) {
				this.forward = true;
				this.next = link.to;
			}
			else {
				this.forward = false;
				this.next = link.from;
			}
			this.link.focus("red");
		}
	}

	reset() {
		this.forward = false;
		this.rewrite = false;
		this.transited = false;
		
		this.at = null; // logical at
		this.next = null; // logical next
		this.link = null;
		
		this.rewriteFlag = RewriteFlag.EMPTY;
		this.dataStack = [CompData.PROMPT];
		this.boxStack = [];
	}
}

var CompData = {
	PROMPT: '*',
	LAMBDA: 'λ',
	R: '@',
}

var RewriteFlag = {
	EMPTY: '□',
	F_LAMBDA: '<λ>',
	F_OP: '<$>',
	F_IF: '<if>',
	F_C: '<C>',
	F_PROMO: '<!>',
	F_RECUR: '<μ>',
}

var BoxData = {
}

