define(function() {

	var UnOpType = {
		Not: 0,
	}

	var BinOpType = {
		And: 0,
		Or: 1,
		Plus: 2,
		Sub: 3,
		Mult: 4,
		Div: 7,
		Lte: 5,
		VecPlus: 6,
		VecMult: 8,
		VecDot: 9,
	}

	var OpType = {
		UnOpType: UnOpType,
		BinOpType: BinOpType,
	}

	return OpType;
})