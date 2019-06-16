define(function(require) {

  var Token = require('parser/token');
  var PatternType = require('parser/pattern');
  var Pattern = require('ast/pattern');
  var Abstraction = require('ast/abstraction');
  var Application = require('ast/application');
  var Identifier = require('ast/identifier');
  var Constant = require('ast/constant');
  var UnaryOp = require('ast/unary-op');
  var BinaryOp = require('ast/binary-op');
  var IfThenElse = require('ast/if-then-else');
  var Recursion = require('ast/recursion');
  var Tuple = require('ast/tuple');
  var ProvisionalConstant = require('ast/provisional-constant');
  var Change = require('ast/change');
  var Assign = require('ast/assign');
  var Propagation = require('ast/propagation');
  var Deprecation = require('ast/deprecation');
  var Dereference = require('ast/deref');
  var Fusion = require('ast/fusion');
  var Pc = require('ast/pc');
  var Folding = require('ast/fold');

  var BinOpType = require('op').BinOpType;
  var UnOpType = require('op').UnOpType;

  class Parser {
    constructor(lexer) {
      this.lexer = lexer;
    }

    parse() {
      const result = this.term([]);
      // make sure we consumed all the program, otherwise there was a syntax error
      this.lexer.match(Token.EOF);

      return result;
    }

    // term ::= LAMBDA LCID DOT term
    //        | LET LCID DEFINE term IN term 
    //        | REC LCID DOT term
    //        | IF term THEN term ELSE term
    //        | application
    term(ctx) {
      if (this.lexer.skip(Token.LAMBDA)) {
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.DOT);
        const term = this.term([id].concat(ctx));
        return new Abstraction(new Pattern(PatternType.Id, id), term);
      } 
      
      else if (this.lexer.skip(Token.LET)) {
        if (this.lexer.skip(Token.LPAREN)) {
          const id1 = this.lexer.token(Token.LCID);
          this.lexer.match(Token.COMMA);
          const id2 = this.lexer.token(Token.LCID);
          this.lexer.match(Token.RPAREN);
          var pattern = new Pattern(PatternType.Tuple, id1, id2);
          this.lexer.match(Token.DEFINE)
          var N = this.term(ctx);
          this.lexer.match(Token.IN);
          const M = this.term([id1,id2].concat(ctx));
          return new Application(new Abstraction(pattern, M), N);
        }
        else {
          var id = this.lexer.token(Token.LCID)
          var pattern = new Pattern(PatternType.Id, id);
          this.lexer.match(Token.DEFINE)
          var N = this.term(ctx);
          this.lexer.match(Token.IN);
          const M = this.term([id].concat(ctx));
          return new Application(new Abstraction(pattern, M), N);
        }
      } 
      else if (this.lexer.skip(Token.REC)) {
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.DOT);
        const term = this.term([id].concat(ctx));
        return new Recursion(id, term);
      }
      else if (this.lexer.skip(Token.IF)) {
        const cond = this.term(ctx);
        this.lexer.match(Token.THEN);
        const t1 = this.term(ctx);
        this.lexer.match(Token.ELSE);
        const t2 = this.term(ctx);
        return new IfThenElse(cond, t1, t2);
      }
      else {
        return this.application(ctx);
      }
    }

    isBinaryOp(token) {
      return token.type == Token.AND || token.type == Token.OR 
          || token.type == Token.PLUS || token.type == Token.SUB  
          || token.type == Token.MULT || token.type == Token.DIV 
          || token.type == Token.LTE || token.type == Token.COMMA
          || token.type == Token.VECPLUS || token.type == Token.VECMULT
          || token.type == Token.VECDOT
    }

    parseBinop(ctx, lhs, pred) {
      var nextToken = this.lexer.lookahead();
      while (this.isBinaryOp(nextToken) && nextToken.pred >= pred) {
        var op = nextToken;
        this.lexer._nextToken();
        var rhs = this.atom(ctx);
        //var rhs = this.term(ctx);
        nextToken = this.lexer.lookahead();
        while (this.isBinaryOp(nextToken) && nextToken.pred > op.pred) {
          rhs = this.parseBinop(ctx, rhs, nextToken.pred);
          nextToken = this.lexer.lookahead();
        }
        if (op.type == Token.AND) {
          lhs = new BinaryOp(BinOpType.And, "&&", lhs, rhs);
        }
        else if (op.type == Token.OR) {
          lhs = new BinaryOp(BinOpType.Or, "||", lhs, rhs);
        }
        else if (op.type == Token.PLUS) {
          lhs = new BinaryOp(BinOpType.Plus, "+", lhs, rhs);
        }
        else if (op.type == Token.SUB) {
          lhs = new BinaryOp(BinOpType.Sub, "-", lhs, rhs);
        }
        else if (op.type == Token.MULT) {
          lhs = new BinaryOp(BinOpType.Mult, "*", lhs, rhs);
        }
        else if (op.type == Token.DIV) {
          lhs = new BinaryOp(BinOpType.Div, "/", lhs, rhs);
        }
        else if (op.type == Token.LTE) {
          lhs = new BinaryOp(BinOpType.Lte, "<=", lhs, rhs);
        }
        else if (op.type == Token.COMMA) {
          lhs = new Tuple(lhs, rhs);
        }
        else if (op.type == Token.VECPLUS) {
          lhs = new BinaryOp(BinOpType.VecPlus, "⊞", lhs, rhs);
        }
        else if (op.type == Token.VECMULT) {
          lhs = new BinaryOp(BinOpType.VecMult, "⊠", lhs, rhs);
        }
        else if (op.type == Token.VECDOT) {
          lhs = new BinaryOp(BinOpType.VecDot, "⊡", lhs, rhs);
        }
      }
      return lhs;
    }

    application(ctx) {
      let lhs = this.atom(ctx);    

      while (true) {
        var rhs;
        if (this.isBinaryOp(this.lexer.lookahead())) {
          lhs = this.parseBinop(ctx, lhs, 0);
        }
        else {
          rhs = this.atom(ctx);
          
          if (!rhs) {
            return lhs;
          } else {
            lhs = new Application(lhs, rhs);
          }
        }
      }
    }

    // atom ::= LPAREN term RPAREN
    //        | LCID
    //        | INT
    //        | TRUE
    //        | FALSE
    //        | NOT term
    //        | PROP 
    //        | CHANGE LCID TO term
    atom(ctx) {
      if (this.lexer.skip(Token.LPAREN)) {
        const term = this.term(ctx);
        this.lexer.match(Token.RPAREN);
        return term;
      } 
      else if (this.lexer.next(Token.LCID)) {
        const id = this.lexer.token(Token.LCID)
        return new Identifier(ctx.indexOf(id), id);
      } 
      else if (this.lexer.next(Token.INT)) {
        const n = this.lexer.token(Token.INT);
        return new Constant(n);
      }
      else if (this.lexer.skip(Token.TRUE)) {
        return new Constant(true);
      } 
      else if (this.lexer.skip(Token.FALSE)) {
        return new Constant(false);
      } 
      else if (this.lexer.skip(Token.NOT)) {
        const term = this.term(ctx);
        return new UnaryOp(UnOpType.Not, "~", term);
      }
      else if (this.lexer.skip(Token.PROP)) {
        return new Propagation();
      }
      else if (this.lexer.skip(Token.DEP)) {
        var term = this.term(ctx);
        return new Deprecation(term);
      }
      else if (this.lexer.skip(Token.DEREF)) {
        var term = this.term(ctx);
        return new Dereference(term);
      }
      else if (this.lexer.skip(Token.CLPAREN)) {
        var term = this.term(ctx);
        this.lexer.match(Token.CRPAREN);
        return new ProvisionalConstant(term);
      }
      else if (this.lexer.skip(Token.CHANGE)) {
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.TO);
        const term = this.term(ctx);
        return new Change(id, term);
      }
      else if (this.lexer.skip(Token.SET)) {
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.TO);
        const term = this.term(ctx);
        return new Assign(id, term); 
      }
      else if (this.lexer.skip(Token.FUSE)) {
        const term = this.term(ctx);
        return new Fusion(term); 
      }
      else if (this.lexer.skip(Token.PC)) {
        const n = this.lexer.token(Token.INT);
        return new Pc(n); 
      }
      else if (this.lexer.skip(Token.FOLD)) {
        const v1 = this.atom(ctx);
        const v2 = this.atom(ctx)
        return new Folding(v1,v2); 
      }
      else {
        return undefined;
      }
    }
  }

  return Parser;
});
