import { readFileSync, readdirSync, writeFileSync } from "fs";
import ts from "typescript";

class FsReader {
  files: string[] = [];

  constructor(path: string, pattern: RegExp) {
    const files = readFileSync(path);
  }
}

class App {
  readFs() {
    // const files = readdirSync(".");
  }
  parse() {}
}

const path = "./testFile.tsx";
const program = ts.createProgram([path], {});
const source = program.getSourceFile(path);

enum PlasmaImportKeys {
  UI = "@salutejs/plasma-ui",
  WEB = "@salutejs/plasma-web",
  TOKENS = "@salutejs/plasma-tokens",
  B2C = "@salutejs/plasma-b2c",
  TOKENSB2C = "@salutejs/plasma-tokens-b2c",
  ICONS = "@salutejs/plasma-icons",
}

const plasmaImportRegexps: Record<PlasmaImportKeys, RegExp> = {
  [PlasmaImportKeys.UI]: /@salutejs\/plasma-ui\/.*/,
  [PlasmaImportKeys.WEB]: /@salutejs\/plasma-web\/.*/,
  [PlasmaImportKeys.TOKENS]: /@salutejs\/plasma-tokens\/.*/,
  [PlasmaImportKeys.B2C]: /@salutejs\/plasma-b2c\/.*/,
  [PlasmaImportKeys.TOKENSB2C]: /@salutejs\/plasma-tokens-b2c\/.*/,
  [PlasmaImportKeys.ICONS]: /@salutejs\/plasma-icons\/.*/,
};

const importsMap = Object.keys(plasmaImportRegexps).reduce(
  (acc, b) => ({ ...acc, [b]: [] }),
  {}
);

const createPlasmaImport = (specifiers: string[], from: string) =>
  ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        specifiers.map((x) =>
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(x)
          )
        )
      )
    ),
    ts.factory.createStringLiteral(from)
  );

const mutator = (context) => {
  const visit = (node) => {
    // console.log(node);
    if (ts.isImportDeclaration(node)) {
      for (const [key, regexp] of Object.entries(plasmaImportRegexps)) {
        // @ts-ignore
        if (regexp.test(node.moduleSpecifier.text)) {
          if (importsMap[key].length === 0) {
            return null;
          }

          const res = createPlasmaImport(importsMap[key], key);

          importsMap[key] = [];

          return res;
        }
      }
    }

    return node;
  };
  return (node) =>
    ts.visitNode(node, (node) => ts.visitEachChild(node, visit, context));
};

const handleImport = (node): boolean => {
  for (const [key, regexp] of Object.entries(plasmaImportRegexps)) {
    if (regexp.test(node.moduleSpecifier.text)) {
      // console.log(
      //   node.importClause?.namedBindings.elements.map((x) => x.name.escapedText)
      // );
      node.importClause?.namedBindings.elements.forEach((x) =>
        importsMap[key].push(x.name.escapedText)
      );

      return true;
    }
  }

  return false;
};

const collector = (context) => {
  const visit = (node) => {
    // console.log(node);

    if (ts.isImportDeclaration(node)) {
      handleImport(node);
    }

    // if (plasmaImportRegexps[0].test(node.moduleSpecifier.text)) {
    //   // @ts-ignore
    //   // console.log(node.moduleSpecifier.text.replace(plasmaImports[0], ""));
    //   console.log(node);
    // }

    return node;
  };

  // return (node) =>
  //   ts.visitNode(node, (node) => {
  //     // delete node.imports[0];
  //     // console.log(node.imports.length);
  //     // @ts-ignore
  //     // @ts-ignore

  //     // console.log(node.statements.length);

  //     // @ts-ignore
  //     for (let i = 0; i < node.statements.length; ++i) {
  //       // @ts-ignore
  //       const statement = node.statements[i];

  //       if (ts.isImportDeclaration(statement)) {
  //         // @ts-ignore
  //         // @ts-ignore
  //         console.log(statement.moduleSpecifier.text);
  //         // @ts-ignore
  //         if (statement.moduleSpecifier.text === "react") {
  //           // @ts-ignore
  //           console.log(statement.moduleSpecifier.text);
  //           // @ts-ignore
  //           delete node.statements[i];
  //         }
  //       }
  //     }

  //     return node;
  //   });
  return (node) =>
    ts.visitNode(node, (node) => ts.visitEachChild(node, visit, context));
};
// console.log(source);

const res = ts.transform(source as any, [collector, mutator]);

const printer = ts.createPrinter();

console.log(printer.printFile(res.transformed[0]));
