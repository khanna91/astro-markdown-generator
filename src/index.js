#! /usr/bin/env node
const { argv } = require('yargs') // eslint-disable-line
  .alias('s', 'source')
  .alias('o', 'output')
  .alias('d', 'deprecated')
  .demandOption(['s', 'o'])
  .help('help')
  .example('markdown-generator -s ./src -o ./markdown');

const _ = require('lodash');
const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const j2s = require('hapi-joi-to-swagger');
const j2sOld = require('joi-to-swagger');

const validatorFile = argv.source;
const outputDir = argv.output;
const { deprecated } = argv;

const checkers = {
  headers: 'header',
  params: 'path',
  query: 'query',
  body: 'body'
};

const curateDocumentation = (files) => {
  const docs = [];
  files.forEach((file) => {
    let markDown = '';
    markDown += `# ${file.name}\n`;
    markDown += `\`\`\`${file.type.toUpperCase()} ${file.path}\`\`\`\n\n`;
    if (file.description) {
      markDown += `### ${file.description}\n\n\n`;
    }
    markDown += `---\n`;
    const joiSchema = file.joiSchema || file.JoiSchema;
    const paramsObject = {
      headers: { title: 'Header Params', data: [] }, params: { title: 'Path Params', data: [] }, query: { title: 'Query Params', data: [] }, body: { title: 'Body Params', data: [] }
    };
    Object.keys(checkers).forEach((checker) => {
      if (!_.isEmpty(joiSchema[checker])) {
        let schema;
        if (deprecated) {
          schema = j2sOld(joiSchema[checker]);
        }
        schema = j2s(joiSchema[checker]);
        const { swagger } = schema;
        for (let key in swagger.properties) { // eslint-disable-line
          const temp = {
            name: key,
            in: checkers[checker],
            required: swagger.required ? swagger.required.includes(key) : false,
            type: swagger.properties[key].type
          };
          paramsObject[checker].data.push(temp);
        }
      }
    });
    Object.keys(paramsObject).forEach((param) => {
      if (paramsObject[param].data.length) {
        markDown += `\`\`\`${paramsObject[param].title}\`\`\`\n`;
        markDown += `| Params | Description |Type | Required | Sample |\n`;
        markDown += `| ----- | ----------- |---- | -------- | ------ |\n`;
        paramsObject[param].data.forEach((data) => {
          markDown += `| ${data.name} |  | ${data.type} | ${!!data.required} |  |\n`;
        });
        markDown += '\n\n';
      }
    });
    markDown += `***\nResponse Formats\n`;
    markDown += '```\n/* Enter Success Response */\n```\n\n';
    markDown += '```\n/* Enter Error Response */\n```';
    docs.push(markDown);
  });
  return docs;
};

const init = () => {
  glob(path.join(validatorFile, '**/*.validator.js'), (err, files) => {
    if (err) {
      console.log('Failed to read files');
      process.exit(0);
    }
    const validationFiles = [];
    const fileNames = [];
    files.forEach((value) => {
      let filename = value.replace('src/handler/', '');
      filename = filename.replace('src/api/', '');
      fileNames.push(filename);
      validationFiles.push(require(path.resolve(value))); // eslint-disable-line
    });

    const docs = curateDocumentation(validationFiles);

    const promises = [];

    docs.forEach((doc, index) => {
      let filename = fileNames[index];
      const names = filename.split('/');
      names.splice(-1, 1);
      filename = names.join('_');
      promises.push(fs.outputFile(`${outputDir}/apiDoc-${filename}.md`, doc, (error) => {
        if (error) {
          throw error;
        }
        return true;
      }));
    });

    Promise.all(promises).then(() => {
      console.log('Markdown documentation ready');
    }).catch(() => { console.log('Failed to generate markdown documentation'); });
  });
};

init();
