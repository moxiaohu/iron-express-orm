const { join, parse, resolve } = require('path');
const { lstatSync, readdirSync, existsSync, copyFileSync } = require('fs');
const { execSync } = require('child_process');

if(!__basedir) {
    throw new Error('app base dir not set')
}
const srcPath = `${__basedir}/src`;
const tmpPath = `${__basedir}/tmp`;

const isDirectory = source => lstatSync(source).isDirectory();

const listModules = () => readdirSync(srcPath)
    .map(name => join(srcPath, name))
    .filter(isDirectory)
    .map(directoryPath => parse(directoryPath).name);

const listFilesInDirectory = src => readdirSync(src)
  .map(name => join(src, name))
  .filter(source => lstatSync(source).isFile());

const { log } = console;

/**
 * Goal of this function is to, for each web modules, check if a migrations folder exists
 * If there is a migrations folder, copy all migration into tmp folder (because it is required that all migrations are in the same place)
 * Then run ORM Migration command
 */
const dbMigrate = () => {
  const modules = listModules();
  const migrationsPath = resolve(`${tmpPath}/migrations`);
  execSync(`rm -f ${migrationsPath}/**.js`);

  modules.forEach((moduleName) => {
    const moduleMigrationPath = `${srcPath}/${moduleName}/migrations`;
    if (existsSync(moduleMigrationPath)) {
      const files = listFilesInDirectory(moduleMigrationPath);
      files.forEach((filepath) => {
        const { base } = parse(filepath);
        copyFileSync(filepath, `${migrationsPath}/${base}`);
      });
    }
  });

  execSync(`yarn knex migrate:latest --cwd tmp`);
  log('Migrations successfully run !');
  // process.exit(0);
};

module.exports = dbMigrate;
