import { useState } from "react";
import "./App.css";

type Token = {
  type: string;
  value: string;
};

type TreeNode = {
  value: string;
  left: TreeNode | null;
  right: TreeNode | null;
  children?: TreeNode[];
};

const keywords = [
  "if",
  "else",
  "while",
  "for",
  "then",
  "return",
  "print",
  "int",
  "float",
  "char",
];
const operators = ["+", "-", "*", "/", "=", "≠", ">", "<", "≥", "≤"];
const tokenRegex =
  /\d+(\.\d+)?|'[^']*'|[a-zA-Z_]\w*|[+\-*/=≠><≥≤]+|[(){}\[\];]|[^\s]/g;

function App() {
  const [sentencia, setSentencia] = useState<string>("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [parseTree, setParseTree] = useState<TreeNode | null>(null);

  const analyzeTokens = (input: string) => {
    const matchedTokens: Token[] = [];
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(input)) !== null) {
      const value = match[0];
      if (keywords.includes(value)) {
        matchedTokens.push({ type: "PALABRA_CLAVE", value });
      } else if (/^\d+(\.\d+)?$/.test(value)) {
        matchedTokens.push({ type: "NUMERO", value });
      } else if (/^'[^']*'$/.test(value)) {
        matchedTokens.push({ type: "CADENA", value });
      } else if (/^[a-zA-Z_]\w*$/.test(value)) {
        matchedTokens.push({ type: "IDENTIFICADOR", value });
      } else if (operators.includes(value)) {
        matchedTokens.push({ type: "OPERADOR", value });
      } else if (/[[\](){};]/.test(value)) {
        matchedTokens.push({ type: "SIMBOLO", value });
      }
    }

    setTokens(matchedTokens);
    generateProgramParseTree(matchedTokens);
  };

  const generateProgramParseTree = (tokens: Token[]) => {
    const createExpressionNode = (tokens: Token[]): TreeNode | null => {
      const operatorPrecedence: Record<string, number> = {
        "=": 0,
        "≠": 0,
        ">": 0,
        "<": 0,
        "≥": 0,
        "≤": 0,
        "+": 1,
        "-": 1,
        "*": 2,
        "/": 2,
      };

      // New function to handle implicit multiplication
      const processImplicitMultiplication = (tokens: Token[]): Token[] => {
        const processedTokens: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
          // Check for implicit multiplication
          if (
            i > 0 &&
            (tokens[i - 1].type === "IDENTIFICADOR" ||
              tokens[i - 1].type === "NUMERO") &&
            tokens[i].value === "("
          ) {
            // Insert multiplication operator
            processedTokens.push({ type: "OPERADOR", value: "*" });
          }

          processedTokens.push(tokens[i]);
        }

        return processedTokens;
      };

      // Process tokens to add implicit multiplication
      const processedTokens = processImplicitMultiplication(tokens);

      const operators: string[] = [];
      const operands: TreeNode[] = [];

      const applyOperator = (operator: string) => {
        const right = operands.pop();
        const left = operands.pop();
        if (left && right) {
          operands.push({
            value: operator,
            left: left,
            right: right,
          });
        }
      };

      for (let i = 0; i < processedTokens.length; i++) {
        const token = processedTokens[i];

        if (
          token.type === "NUMERO" ||
          token.type === "IDENTIFICADOR" ||
          token.type === "CADENA"
        ) {
          operands.push({ value: token.value, left: null, right: null });
        } else if (token.type === "OPERADOR") {
          while (
            operators.length > 0 &&
            operatorPrecedence[operators[operators.length - 1]] >=
              operatorPrecedence[token.value]
          ) {
            applyOperator(operators.pop()!);
          }
          operators.push(token.value);
        } else if (token.value === "(") {
          operators.push(token.value);
        } else if (token.value === ")") {
          while (operators[operators.length - 1] !== "(") {
            applyOperator(operators.pop()!);
          }
          operators.pop();
        } else if (token.value === "[") {
          const subTokens: Token[] = [];
          let bracketCount = 1;

          while (bracketCount > 0 && i + 1 < processedTokens.length) {
            i++;
            if (processedTokens[i].value === "[") bracketCount++;
            else if (processedTokens[i].value === "]") bracketCount--;

            if (bracketCount > 0) subTokens.push(processedTokens[i]);
          }

          const innerNode = createExpressionNode(subTokens);
          if (innerNode) {
            const arrayNode = operands.pop();
            if (arrayNode) {
              operands.push({
                value: arrayNode.value,
                left: null,
                right: {
                  value: "[]",
                  left: innerNode,
                  right: null,
                },
              });
            }
          }
        }
      }

      while (operators.length > 0) {
        applyOperator(operators.pop()!);
      }

      return operands[0] || null;
    };

    const createBlockNode = (blockTokens: Token[]): TreeNode | null => {
      const statements: TreeNode[] = [];
      let currentStatementTokens: Token[] = [];

      for (const token of blockTokens) {
        if (token.value === ";") {
          if (currentStatementTokens.length > 0) {
            const statement = createStatementNode(currentStatementTokens);
            if (statement) statements.push(statement);
            currentStatementTokens = [];
          }
        } else {
          currentStatementTokens.push(token);
        }
      }

      if (currentStatementTokens.length > 0) {
        const statement = createStatementNode(currentStatementTokens);
        if (statement) statements.push(statement);
      }

      return {
        value: "block",
        left: null,
        right: null,
        children: statements,
      };
    };

    const createStatementNode = (statementTokens: Token[]): TreeNode | null => {
      if (statementTokens.length === 0) return null;

      const firstToken = statementTokens[0];

      // Variable Declaration
      if (
        (firstToken.value === "int" ||
          firstToken.value === "float" ||
          firstToken.value === "char") &&
        statementTokens[1]?.type === "IDENTIFICADOR" &&
        statementTokens[2]?.type === "OPERADOR" &&
        statementTokens[2].value === "="
      ) {
        return {
          value: "declaracion",
          left: {
            value: firstToken.value,
            left: { value: statementTokens[1].value, left: null, right: null },
            right: null,
          },
          right: createExpressionNode(statementTokens.slice(3)),
          children: undefined,
        };
      }

      // Print Statement
      if (firstToken.type === "PALABRA_CLAVE" && firstToken.value === "print") {
        return {
          value: "print",
          left: createExpressionNode(statementTokens.slice(1)),
          right: null,
          children: undefined,
        };
      }

      // If-Else Statement
      if (firstToken.type === "PALABRA_CLAVE" && firstToken.value === "if") {
        const conditionStart = statementTokens.findIndex(
          (t) => t.value === "("
        );
        const conditionEnd = statementTokens.findIndex((t) => t.value === ")");
        const thenIndex = statementTokens.findIndex((t) => t.value === "then");
        const elseIndex = statementTokens.findIndex((t) => t.value === "else");

        // Extract and parse condition tokens explicitly
        const conditionTokens = statementTokens.slice(
          conditionStart + 1,
          conditionEnd
        );
        const condition = createExpressionNode(conditionTokens);

        const thenBlock = createBlockNode(
          statementTokens.slice(
            thenIndex + 1,
            elseIndex > -1 ? elseIndex : undefined
          )
        );
        const elseBlock =
          elseIndex > -1
            ? createBlockNode(statementTokens.slice(elseIndex + 1))
            : null;

        return {
          value: "if-else",
          left: {
            value: "condition",
            left: condition,
            right: null,
          },
          right: {
            value: "branches",
            left: thenBlock,
            right: elseBlock,
          },
          children: undefined,
        };
      }

      // While Loop
      if (firstToken.type === "PALABRA_CLAVE" && firstToken.value === "while") {
        const conditionStart = statementTokens.findIndex(
          (t) => t.value === "("
        );
        const conditionEnd = statementTokens.findIndex((t) => t.value === ")");

        // Extract and parse condition tokens explicitly
        const conditionTokens = statementTokens.slice(
          conditionStart + 1,
          conditionEnd
        );
        const condition = createExpressionNode(conditionTokens);

        const blockStart = statementTokens.findIndex((t) => t.value === "{");
        const blockEnd = statementTokens.findIndex((t) => t.value === "}");

        const blockTokens = statementTokens.slice(blockStart + 1, blockEnd);
        const block = createBlockNode(blockTokens);

        return {
          value: "while",
          left: {
            value: "condition",
            left: condition,
            right: null,
          },
          right: block,
          children: undefined,
        };
      }

      // For Loop
      if (firstToken.type === "PALABRA_CLAVE" && firstToken.value === "for") {
        const blockStart = statementTokens.findIndex((t) => t.value === "{");
        const blockEnd = statementTokens.findIndex((t) => t.value === "}");

        const forParts = statementTokens
          .slice(1, blockStart)
          .filter((t) => t.value !== "(" && t.value !== ")");

        // Explicitly parse initialization, condition, and increment
        const initNode = createStatementNode([
          forParts[0],
          forParts[1],
          forParts[2],
        ]);
        const conditionNode = createExpressionNode([
          forParts[3],
          forParts[4],
          forParts[5],
        ]);
        const incrementNode = createStatementNode([
          forParts[6],
          forParts[7],
          forParts[8],
        ]);

        const blockTokens = statementTokens.slice(blockStart + 1, blockEnd);
        const block = createBlockNode(blockTokens);

        return {
          value: "for",
          left: {
            value: "init-cond-increment",
            left: {
              value: "init",
              left: initNode,
              right: null,
            },
            right: {
              value: "condition-increment",
              left: {
                value: "condition",
                left: conditionNode,
                right: null,
              },
              right: {
                value: "increment",
                left: incrementNode,
                right: null,
              },
            },
          },
          right: block,
          children: undefined,
        };
      }

      // Assignment and Array Indexing
      if (
        firstToken.type === "IDENTIFICADOR" &&
        statementTokens[1]?.type === "SIMBOLO" &&
        statementTokens[1].value === "[" &&
        statementTokens[3]?.type === "SIMBOLO" &&
        statementTokens[3].value === "]" &&
        statementTokens[4]?.type === "OPERADOR" &&
        statementTokens[4].value === "="
      ) {
        const indexExpression = createExpressionNode([
          statementTokens[1],
          statementTokens[2],
          statementTokens[3],
        ]);

        return {
          value: "=",
          left: {
            value: firstToken.value,
            left: null,
            right: {
              value: "[]",
              left: indexExpression,
              right: null,
            },
          },
          right: createExpressionNode(statementTokens.slice(5)),
          children: undefined,
        };
      }

      // Simple Assignment
      if (
        firstToken.type === "IDENTIFICADOR" &&
        statementTokens[1]?.type === "OPERADOR" &&
        statementTokens[1].value === "="
      ) {
        return {
          value: "=",
          left: { value: statementTokens[0].value, left: null, right: null },
          right: createExpressionNode(statementTokens.slice(2)),
          children: undefined,
        };
      }

      return createExpressionNode(statementTokens);
    };

    const programNode = createBlockNode(tokens);
    setParseTree(programNode);
  };

  const renderParseTree = (node: TreeNode | null) => {
    if (!node) return null;

    // Skip rendering nodes with values 'block', 'condition', or 'branches'
    if (["block", "condition", "branches"].includes(node.value)) {
      if (node.left) return renderParseTree(node.left);
      if (node.right) return renderParseTree(node.right);
      if (node.children)
        return node.children.map((child, index) => (
          <div key={index} className="child">
            {renderParseTree(child)}
          </div>
        ));
      return null;
    }

    return (
      <div className="tree-node">
        <div className="node-value">{node.value}</div>
        {node.left || node.right || node.children ? (
          <div className="children">
            {node.left && (
              <div className="left">{renderParseTree(node.left)}</div>
            )}
            {node.right && (
              <div className="right">{renderParseTree(node.right)}</div>
            )}
            {node.children &&
              node.children.map((child, index) => (
                <div key={index} className="child">
                  {renderParseTree(child)}
                </div>
              ))}
          </div>
        ) : null}
      </div>
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSentencia(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeTokens(sentencia);
  };

  return (
    <main className="main">
      <div className="titulo">
        <h1>Analizador Léxico y Sintáctico</h1>
      </div>
      <article className="article">
        <section className="container1">
          <span className="subtitle">Sentencia</span>
          <form onSubmit={handleSubmit}>
            <textarea
              className="area1"
              rows={5}
              cols={50}
              value={sentencia}
              onChange={handleChange}
              required
              placeholder="Escribe aquí tus expresiones o código..."
            ></textarea>
            <br />
            <div className="btn-block">
              <button className="button" type="submit">
                Analizar
              </button>
            </div>
          </form>
        </section>
        <section className="container2">
          <span className="subtitle">Tokens Identificados</span>
          <ul className="token-list">
            {tokens.map((token, index) => (
              <li key={index}>
                {token.type}: {token.value}
              </li>
            ))}
          </ul>
        </section>
      </article>
      <section className="container3">
        <span className="subtitle">Árbol de Parsing</span>
        <div className="tree-container">{renderParseTree(parseTree)}</div>
      </section>
    </main>
  );
}

export default App;
