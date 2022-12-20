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

const plasmaImports = ["@salutejs/plasma-ui"];
const plasmaImportRegexps = [/@salutejs\/plasma-ui\/.*/];
const importMap = {};

const mutator = (context) => {
  const visit = (node) => {
    // console.log(node);

    return node;
  };
  return (node) =>
    ts.visitNode(node, (node) => ts.visitEachChild(node, visit, context));
};

const collector = (context) => {
  const visit = (node) => {
    // console.log(node);

    if (ts.isImportDeclaration(node)) {
      return null;
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
