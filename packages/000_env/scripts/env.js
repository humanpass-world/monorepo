#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// JSONC 파싱 함수
async function parseJSONC(content) {
  const stripJsonComments = (await import("strip-json-comments")).default;
  const withoutComments = stripJsonComments(content);
  return JSON.parse(withoutComments);
}

// 환경 변수를 .env 파일 형식으로 변환
function formatEnvVars(envVars) {
  return Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

// 환경 변수를 .env.production.json 파일 형식으로 변환
function formatEnvProductionJson(envVars) {
  return `{\n${Object.entries(envVars)
    .map(([key, value]) => `"${key}": "${value}"`)
    .join(",\n")}\n}`;
}

// .env 파일 생성
function createEnvFile(filePath, content) {
  const dir = path.dirname(filePath);

  // 디렉토리가 없으면 생성하지 않고 경고만 출력
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Directory does not exist: ${dir}`);
    return;
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Created: ${filePath}`);
}

async function main() {
  try {
    // CI 모드 확인
    const isCiMode = process.argv.includes("--ci");

    // 설정 파일들 읽기
    const envJsoncPath = path.join(__dirname, "..", "env.jsonc");
    const myNamePath = path.join(__dirname, "..", ".mynameis");

    if (!fs.existsSync(envJsoncPath)) {
      console.error("❌ env.jsonc file not found");
      process.exit(1);
    }

    let developerName = null;

    if (isCiMode) {
      console.log(
        "🏗️  CI mode: generating staging and production environment files only"
      );
    } else {
      if (!fs.existsSync(myNamePath)) {
        console.error("❌ .mynameis file not found");
        process.exit(1);
      }
      developerName = fs.readFileSync(myNamePath, "utf8").trim();
      console.log(
        `🚀 Generating environment files for developer: ${developerName}`
      );
    }

    const envConfig = await parseJSONC(fs.readFileSync(envJsoncPath, "utf8"));
    console.log("");

    // 각 프로젝트에 대해 .env 파일들 생성
    Object.entries(envConfig.project).forEach(
      ([projectName, projectConfig]) => {
        const projectPath = path.join(
          process.cwd(),
          "../../",
          projectConfig.path
        );
        console.log(`📁 Processing project: ${projectName} (${projectPath})`);

        // 모든 .env 파일 삭제
        if (fs.existsSync(path.join(projectPath, ".env"))) {
          fs.unlinkSync(path.join(projectPath, ".env"));
        }

        if (fs.existsSync(path.join(projectPath, ".env.production.json"))) {
          fs.unlinkSync(path.join(projectPath, ".env.production.json"));
        }

        // .env (local) 파일 생성 - CI 모드가 아닐 때만
        if (!isCiMode && projectConfig.local) {
          let localEnvVars = { ...projectConfig.local };

          // local-override에서 개발자별 설정 병합
          const overrides =
            envConfig["local-override"]?.[developerName]?.[projectName];
          if (overrides) {
            localEnvVars = { ...localEnvVars, ...overrides };
          }

          const localEnvContent = formatEnvVars(localEnvVars);
          createEnvFile(path.join(projectPath, ".env"), localEnvContent);
        }

        // .env.production.json 파일 생성
        if (projectConfig.production) {
          const productionEnvContent = formatEnvProductionJson(
            projectConfig.production
          );
          createEnvFile(
            path.join(projectPath, ".env.production.json"),
            productionEnvContent
          );
        }

        console.log("");
      }
    );

    console.log("🎉 Environment files generation completed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}
