define(function(require) {

  var Token = require('parser/token');
  var PatternType = require('parser/pattern');
  var Pattern = require('ast/pattern');
  var Abstraction = require('ast/abstraction');
  var Application = require('ast/application');
  var Identifier = require('ast/identifier');
  var Constant = require('ast/constant');
  var Operation = require('ast/operation');
  var IfThenElse = require('ast/if-then-else');
  var Recursion = require('ast/recursion');
  var Tuple = require('ast/tuple');
  var CellCreation = require('ast/cell-creation');
  var Fusion = require('ast/fusion');
  var Pc = require('ast/pc'); 
  var NameAbstraction = require('ast/name-abstraction');
  var NameInstantiation = require('ast/name-instantiation');

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
    //        | LET PATTERN DEFINE term IN term 
    //        | REC LCID DOT term
    //        | IF term THEN term ELSE term
    //        | FUSE LPAREM LCID RPAREM LCID DOT term
    //        | BIGLAMBDA LCID DOT term
    //        | FUSION(a) LCID FROM term IN term 
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
      else if (this.lexer.skip(Token.FUSE)) {
        this.lexer.match(Token.LPAREN);
        const name = this.lexer.token(Token.LCID);
        this.lexer.match(Token.RPAREN);
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.DOT);
        const term = this.term(ctx);
        return new Fusion(name, id, term); 
      }
      else if (this.lexer.skip(Token.FUSION)) {
        this.lexer.match(Token.LPAREN);
        const name = this.lexer.token(Token.LCID);
        this.lexer.match(Token.RPAREN);
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.FROM)
        const N = this.term(ctx);
        this.lexer.match(Token.IN);
        const M = this.term([id].concat(ctx));
        return new Application(new Fusion(name, id, M), N);
      }
      else if (this.lexer.skip(Token.BIGLAMBDA)) {
        const id = this.lexer.token(Token.LCID);
        this.lexer.match(Token.DOT);
        const term = this.term(ctx);
        return new NameAbstraction(id, term); 
      }
      else {
        return this.application(ctx);
      }
    }

    isBinaryOp(token) {
      return token.type == Token.AND || token.type == Token.OR 
          || token.type == Token.PLUS || token.type == Token.SUB  
          || token.type == Token.MULT || token.type == Token.DIV 
          || token.type == Token.MOD || token.type == Token.NEQ
          || token.type == Token.LTE || token.type == Token.COMMA
          || token.type == Token.VECPLUS || token.type == Token.VECMULT
          || token.type == Token.VECDOT 
    }

    parseBinop(ctx, lhs, pred) {
      var nextToken = this.lexer.lookahead();
      while (this.isBinaryOp(nextToken) && nextToken.pred >= pred) {
        var op = nextToken;
        this.lexer._nextToken();
        nextToken = this.lexer.lookahead(); 
        var binop = new Operation(op.type, op.value);
        if (nextToken.type == Token.LSQPAREN) {
            this.lexer.skip(Token.LSQPAREN);
            var id = this.lexer.token(Token.LCID);
            this.lexer.match(Token.RSQPAREN);   
            binop.hasPname = true; 
            binop = new NameInstantiation(id, binop);
        }
        var rhs = this.atom(ctx);
        //var rhs = this.term(ctx);
        nextToken = this.lexer.lookahead();
        while (this.isBinaryOp(nextToken) && nextToken.pred > op.pred) {
          rhs = this.parseBinop(ctx, rhs, nextToken.pred);
          nextToken = this.lexer.lookahead();
        }
        lhs = new Application(new Application(binop, lhs), rhs);
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
        else if (this.lexer.lookahead().type == Token.LSQPAREN) {
          this.lexer.skip(Token.LSQPAREN);
          var id = this.lexer.token(Token.LCID);
          this.lexer.match(Token.RSQPAREN);
          /*
          rhs = this.atom(ctx);
          if (!rhs) {
            return lhs;
          } else {
            lhs = new NameInstantiation(lhs, rhs);
          }
          */
          lhs.hasPname = true;
          lhs = new NameInstantiation(id, lhs);
        }
        else if (this.lexer.lookahead().type == Token.SEQ) {
          this.lexer.skip(Token.SEQ);
          rhs = this.term(ctx);
          return new Application(new Abstraction(new Pattern(PatternType.Id, '_'), rhs), lhs)
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
    //        | CLPAREM term CRPAREM
    //        | PC INT
    //        | op 
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
      else if (this.lexer.skip(Token.CLPAREN)) {
        var term = this.term(ctx);
        this.lexer.match(Token.CRPAREN);
        return new Application(new Operation(Token.CELLCREATE, null), term); 
      }
      else if (this.lexer.skip(Token.PC)) {
        const n = this.lexer.token(Token.INT);
        return new Pc(n); 
      }
      else if (this.lexer.next(Token.PEEK) || this.lexer.next(Token.DEREF) || this.lexer.next(Token.LINK)
               || this.lexer.next(Token.ROOT) 
               || this.lexer.next(Token.ASSIGN) || this.lexer.next(Token.STEP) || this.lexer.next(Token.FOLD)
               || this.lexer.next(Token.AND) || this.lexer.next(Token.OR) || this.lexer.next(Token.PLUS)
               || this.lexer.next(Token.SUB) || this.lexer.next(Token.MULT) || this.lexer.next(Token.DIV)
               || this.lexer.next(Token.MOD) || this.lexer.next(Token.NEQ) 
               || this.lexer.next(Token.LTE) || this.lexer.next(Token.COMMA) || this.lexer.next(Token.VECPLUS)
               || this.lexer.next(Token.VECMULT) || this.lexer.next(Token.VECDOT)
              ) {
        var op = this.lexer.lookahead();
        this.lexer._nextToken();
        return new Operation(op.type, op.value); 
      }
      else {
        return undefined;
      }
    }
  }

  return Parser;
});
