import { readFileSync, readdirSync, writeFileSync, statSync } from "fs";
import { resolve } from "path";
import ts from "typescript";
import yargs from "yargs";
import glob from "glob";

// @ts-ignore
const ARGS = yargs(process.argv)
  .options({
    pattern: { type: "string" },
  })
  .parseSync();

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

let hasChange = false;

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
          hasChange = true;
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
      // console.log(node.importClause?.getChildAt(0));

      node.importClause?.namedBindings.elements.forEach((x) => {
        if (x?.propertyName?.escapedText) {
          importsMap[key].push(
            `${x.propertyName.escapedText} as ${x.name.escapedText}`
          );
        } else {
          importsMap[key].push(x.name.escapedText);
        }
      });

      return true;
    }
  }

  return false;
};

const collector = (context) => {
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      // let clauses = node.importClause?.forEachChild((x) => {
      //   if (ts.isNamedImports(x)) {
      //     x.elements.forEach((x) => {
      //       console.log(x.propertyName?.escapedText);
      //     });
      //   }
      // });
      handleImport(node);
    }

    return node;
  };

  return (node) =>
    ts.visitNode(node, (node) => ts.visitEachChild(node, visit, context));
};
// console.log(source);

// const traverseFilesystem = (dirpath: string, filesArrRef: string[]) => {
//   readdirSync(dirpath).forEach((file) => {
//     const filepath = resolve(dirpath, file);
//     const status = statSync(filepath);

//     if (status.isDirectory()) {
//       traverseFilesystem(filepath, filesArrRef);
//     } else {
//       filesArrRef.push(filepath);
//     }
//   });
// };

const trimLine = (line) => line?.replace(/\s|`|;/g, "");

function main() {
  // const files = [];
  // traverseFilesystem(ARGS.path, files);
  // console.log(files);
  glob(
    "/home/rpg59/work/frontend/services/catalog/src/**/*.tsx",
    (err, files) => {
      console.log(files);
      const printer = ts.createPrinter();

      files.forEach((file) => {
        hasChange = false;
        const program = ts.createProgram([file], {});
        const source = program.getSourceFile(file);
        const res = ts.transform(source as any, [collector, mutator]);

        if (hasChange) {
          const lines = readFileSync(file)
            .toString()
            .split(";")
            .filter((x) => /^(?!import)/.test(x.replace(/\n/g, "")))
            .join(";");

          const newFileArr = printer
            .printFile(res.transformed[0])
            .split("\n")
            .filter((x) => /^import/.test(x))
            .join("\n");

          // console.log(newFileArr.concat(lines));

          console.log(newFile);

          // writeFileSync(file, unescape(newFile.replace(/\\u/g, "%u")));
          writeFileSync(file, newFileArr.concat(lines));
        }
      });
    }
  );

  // console.log(ARGS.path);
}

main();
