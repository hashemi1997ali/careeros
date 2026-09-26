using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace server.Migrations;

public partial class ShareSkillsAcrossUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_ProjectSkills_Skills_SkillId", "ProjectSkills");
        migrationBuilder.DropForeignKey("FK_Skills_Users_UserId", "Skills");
        migrationBuilder.DropIndex("IX_ProjectSkills_SkillId", "ProjectSkills");
        migrationBuilder.DropIndex("IX_Skills_UserId_Name_Category", "Skills");
        migrationBuilder.RenameTable(name: "Skills", newName: "UserSkills");
        migrationBuilder.RenameColumn(name: "SkillId", table: "ProjectSkills", newName: "UserSkillId");
        migrationBuilder.Sql("ALTER TABLE \"UserSkills\" RENAME CONSTRAINT \"PK_Skills\" TO \"PK_UserSkills\"; ALTER SEQUENCE IF EXISTS \"Skills_Id_seq\" RENAME TO \"UserSkills_Id_seq\";");

        migrationBuilder.CreateTable(
            name: "Skills",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Name = table.Column<string>(type: "text", nullable: false),
                Category = table.Column<string>(type: "text", nullable: false),
                Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                CategorySlug = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Skills", x => x.Id));

        migrationBuilder.AddColumn<int>(name: "SkillId", table: "UserSkills", type: "integer", nullable: true);
        migrationBuilder.Sql("""
            CREATE TEMP TABLE "NormalizedSkillBackfill" ON COMMIT DROP AS
            WITH prepared AS (
                SELECT "Id", "UserId", "Level", "StartDate", "Name", "Category",
                    trim(both '-' from regexp_replace(
                        regexp_replace(
                            regexp_replace(
                                regexp_replace(lower(trim("Name")), 'c[[:space:]]*#', 'c-sharp', 'g'),
                                'c[[:space:]]*\+[[:space:]]*\+', 'c-plus-plus', 'g'),
                            '\.net', 'dotnet', 'g'),
                        '[^a-z0-9]+', '-', 'g')) AS "RawSlug",
                    trim(both '-' from regexp_replace(lower(trim("Category")), '[^a-z0-9]+', '-', 'g')) AS "RawCategorySlug"
                FROM "UserSkills"
            ), aliases AS (
                SELECT *, CASE "RawSlug"
                    WHEN 'js' THEN 'javascript' WHEN 'javascript' THEN 'javascript'
                    WHEN 'ts' THEN 'typescript' WHEN 'typescript' THEN 'typescript'
                    WHEN 'node' THEN 'nodejs' WHEN 'nodejs' THEN 'nodejs' WHEN 'node-js' THEN 'nodejs'
                    WHEN 'reactjs' THEN 'react' WHEN 'react-js' THEN 'react'
                    WHEN 'nextjs' THEN 'nextjs' WHEN 'next-js' THEN 'nextjs'
                    WHEN 'vuejs' THEN 'vuejs' WHEN 'vue-js' THEN 'vuejs'
                    WHEN 'csharp' THEN 'c-sharp' WHEN 'c-sharp' THEN 'c-sharp'
                    WHEN 'cpp' THEN 'c-plus-plus' WHEN 'c-plus-plus' THEN 'c-plus-plus'
                    WHEN 'net' THEN 'dotnet' WHEN 'dotnet' THEN 'dotnet'
                    WHEN 'aspnet' THEN 'aspdotnet' WHEN 'aspdotnet' THEN 'aspdotnet'
                    WHEN 'aspnetcore' THEN 'aspdotnet-core' WHEN 'aspdotnet-core' THEN 'aspdotnet-core'
                    WHEN 'html' THEN 'html' WHEN 'css' THEN 'css' WHEN 'sql' THEN 'sql'
                    WHEN 'api' THEN 'api' WHEN 'ios' THEN 'ios' WHEN 'macos' THEN 'macos'
                    WHEN 'aws' THEN 'aws' WHEN 'gcp' THEN 'gcp' WHEN 'graphql' THEN 'graphql'
                    WHEN 'mongodb' THEN 'mongodb' WHEN 'postgres' THEN 'postgresql'
                    WHEN 'postgresql' THEN 'postgresql' WHEN 'mysql' THEN 'mysql'
                    WHEN 'github' THEN 'github' WHEN 'gitlab' THEN 'gitlab' WHEN 'devops' THEN 'devops'
                    ELSE "RawSlug" END AS "Slug",
                    CASE "RawCategorySlug"
                        WHEN 'front-end' THEN 'frontend' WHEN 'frontend' THEN 'frontend'
                        WHEN 'back-end' THEN 'backend' WHEN 'backend' THEN 'backend'
                        WHEN 'devops' THEN 'devops' WHEN 'ui-ux' THEN 'ui-ux' WHEN 'ux-ui' THEN 'ui-ux'
                        ELSE "RawCategorySlug" END AS "CategorySlug"
                FROM prepared
            )
            SELECT "Id", "UserId", "Level", "StartDate", "Slug", "CategorySlug",
                CASE "Slug"
                    WHEN 'javascript' THEN 'JavaScript' WHEN 'typescript' THEN 'TypeScript'
                    WHEN 'nodejs' THEN 'Node.js' WHEN 'react' THEN 'React'
                    WHEN 'nextjs' THEN 'Next.js' WHEN 'vuejs' THEN 'Vue.js'
                    WHEN 'c-sharp' THEN 'C#' WHEN 'c-plus-plus' THEN 'C++'
                    WHEN 'dotnet' THEN '.NET' WHEN 'aspdotnet' THEN 'ASP.NET'
                    WHEN 'aspdotnet-core' THEN 'ASP.NET Core' WHEN 'html' THEN 'HTML'
                    WHEN 'css' THEN 'CSS' WHEN 'sql' THEN 'SQL' WHEN 'api' THEN 'API'
                    WHEN 'ios' THEN 'iOS' WHEN 'macos' THEN 'macOS' WHEN 'aws' THEN 'AWS'
                    WHEN 'gcp' THEN 'GCP' WHEN 'graphql' THEN 'GraphQL' WHEN 'mongodb' THEN 'MongoDB'
                    WHEN 'postgresql' THEN 'PostgreSQL' WHEN 'mysql' THEN 'MySQL'
                    WHEN 'github' THEN 'GitHub' WHEN 'gitlab' THEN 'GitLab' WHEN 'devops' THEN 'DevOps'
                    ELSE initcap(trim("Name")) END AS "CanonicalName",
                CASE "CategorySlug"
                    WHEN 'frontend' THEN 'Frontend' WHEN 'backend' THEN 'Backend'
                    WHEN 'devops' THEN 'DevOps' WHEN 'ui-ux' THEN 'UI/UX'
                    ELSE initcap(trim("Category")) END AS "CanonicalCategory"
            FROM aliases;

            INSERT INTO "Skills" ("Name", "Category", "Slug", "CategorySlug")
            SELECT DISTINCT ON ("Slug", "CategorySlug")
                "CanonicalName", "CanonicalCategory", "Slug", "CategorySlug"
            FROM "NormalizedSkillBackfill"
            ORDER BY "Slug", "CategorySlug", "CanonicalName", "CanonicalCategory";

            UPDATE "UserSkills" AS user_skill
            SET "SkillId" = catalog."Id"
            FROM "NormalizedSkillBackfill" AS normalized
            JOIN "Skills" AS catalog
              ON catalog."Slug" = normalized."Slug"
             AND catalog."CategorySlug" = normalized."CategorySlug"
            WHERE user_skill."Id" = normalized."Id";

            WITH grouped AS (
                SELECT "UserId", "SkillId", MIN("Id") AS "KeeperId",
                    CASE MAX(CASE "Level" WHEN 'Advanced' THEN 3 WHEN 'Intermediate' THEN 2 ELSE 1 END)
                        WHEN 3 THEN 'Advanced' WHEN 2 THEN 'Intermediate' ELSE 'Beginner' END AS "BestLevel",
                    MIN("StartDate") AS "EarliestStartDate"
                FROM "UserSkills"
                GROUP BY "UserId", "SkillId"
                HAVING COUNT(*) > 1
            )
            UPDATE "UserSkills" AS keeper
            SET "Level" = grouped."BestLevel", "StartDate" = grouped."EarliestStartDate"
            FROM grouped
            WHERE keeper."Id" = grouped."KeeperId";

            WITH ranked AS (
                SELECT "Id", MIN("Id") OVER (PARTITION BY "UserId", "SkillId") AS "KeeperId"
                FROM "UserSkills"
            ), duplicates AS (
                SELECT "Id", "KeeperId" FROM ranked WHERE "Id" <> "KeeperId"
            )
            UPDATE "ProjectSkills" AS project_skill
            SET "UserSkillId" = duplicate."KeeperId"
            FROM duplicates AS duplicate
            WHERE project_skill."UserSkillId" = duplicate."Id"
              AND NOT EXISTS (
                  SELECT 1 FROM "ProjectSkills" AS existing
                  WHERE existing."ProjectId" = project_skill."ProjectId"
                    AND existing."UserSkillId" = duplicate."KeeperId");

            WITH ranked AS (
                SELECT "Id", MIN("Id") OVER (PARTITION BY "UserId", "SkillId") AS "KeeperId"
                FROM "UserSkills"
            ), duplicates AS (
                SELECT "Id" FROM ranked WHERE "Id" <> "KeeperId"
            )
            DELETE FROM "ProjectSkills" AS project_skill
            USING duplicates
            WHERE project_skill."UserSkillId" = duplicates."Id";

            WITH ranked AS (
                SELECT "Id", MIN("Id") OVER (PARTITION BY "UserId", "SkillId") AS "KeeperId"
                FROM "UserSkills"
            )
            DELETE FROM "UserSkills" AS user_skill
            USING ranked
            WHERE user_skill."Id" = ranked."Id"
              AND ranked."Id" <> ranked."KeeperId";
            """);

        migrationBuilder.DropColumn(name: "Name", table: "UserSkills");
        migrationBuilder.DropColumn(name: "Category", table: "UserSkills");
        migrationBuilder.AlterColumn<int>(name: "SkillId", table: "UserSkills", type: "integer", nullable: false, oldClrType: typeof(int), oldType: "integer", oldNullable: true);
        migrationBuilder.CreateIndex("IX_Skills_Slug_CategorySlug", "Skills", new[] { "Slug", "CategorySlug" }, unique: true);
        migrationBuilder.CreateIndex("IX_UserSkills_SkillId", "UserSkills", "SkillId");
        migrationBuilder.CreateIndex("IX_UserSkills_UserId_SkillId", "UserSkills", new[] { "UserId", "SkillId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ProjectSkills_UserSkillId", "ProjectSkills", "UserSkillId");
        migrationBuilder.AddForeignKey("FK_UserSkills_Users_UserId", "UserSkills", "UserId", "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        migrationBuilder.AddForeignKey("FK_UserSkills_Skills_SkillId", "UserSkills", "SkillId", "Skills", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey("FK_ProjectSkills_UserSkills_UserSkillId", "ProjectSkills", "UserSkillId", "UserSkills", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_ProjectSkills_UserSkills_UserSkillId", "ProjectSkills");
        migrationBuilder.DropForeignKey("FK_UserSkills_Skills_SkillId", "UserSkills");
        migrationBuilder.DropForeignKey("FK_UserSkills_Users_UserId", "UserSkills");
        migrationBuilder.DropIndex("IX_UserSkills_SkillId", "UserSkills");
        migrationBuilder.DropIndex("IX_UserSkills_UserId_SkillId", "UserSkills");
        migrationBuilder.DropIndex("IX_ProjectSkills_UserSkillId", "ProjectSkills");
        migrationBuilder.DropIndex("IX_Skills_Slug_CategorySlug", "Skills");
        migrationBuilder.RenameColumn(name: "UserSkillId", table: "ProjectSkills", newName: "SkillId");
        migrationBuilder.RenameTable(name: "Skills", newName: "SkillCatalog");
        migrationBuilder.AddColumn<string>(name: "Name", table: "UserSkills", type: "text", nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "Category", table: "UserSkills", type: "text", nullable: false, defaultValue: "");
        migrationBuilder.Sql("""
            UPDATE "UserSkills" AS user_skill
            SET "Name" = catalog."Name", "Category" = catalog."Category"
            FROM "SkillCatalog" AS catalog
            WHERE user_skill."SkillId" = catalog."Id";
            """);
        migrationBuilder.DropColumn(name: "SkillId", table: "UserSkills");
        migrationBuilder.DropTable(name: "SkillCatalog");
        migrationBuilder.RenameTable(name: "UserSkills", newName: "Skills");
        migrationBuilder.Sql("ALTER TABLE \"Skills\" RENAME CONSTRAINT \"PK_UserSkills\" TO \"PK_Skills\"; ALTER SEQUENCE IF EXISTS \"UserSkills_Id_seq\" RENAME TO \"Skills_Id_seq\";");
        migrationBuilder.CreateIndex("IX_Skills_UserId_Name_Category", "Skills", new[] { "UserId", "Name", "Category" }, unique: true);
        migrationBuilder.CreateIndex("IX_ProjectSkills_SkillId", "ProjectSkills", "SkillId");
        migrationBuilder.AddForeignKey("FK_Skills_Users_UserId", "Skills", "UserId", "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        migrationBuilder.AddForeignKey("FK_ProjectSkills_Skills_SkillId", "ProjectSkills", "SkillId", "Skills", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
    }
}
