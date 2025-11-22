import sequelize from "../db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {};

const modelFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"));

for (const file of modelFiles) {
  const modelModule = await import(`./${file}`);
  const defineModel = modelModule.default;

  if (!defineModel) {
    console.error(`❌ Model "${file}" missing default export`);
    continue;
  }

  const model = defineModel(sequelize);
  models[model.name] = model;
}

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = sequelize.Sequelize;

export default models;
