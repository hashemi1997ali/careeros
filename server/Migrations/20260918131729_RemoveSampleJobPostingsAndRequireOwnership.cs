using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSampleJobPostingsAndRequireOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_Skills_UserId_Name_Category",
                table: "Skills");

            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    owner_count integer;
                    owner_id uuid;
                BEGIN
                    SELECT COUNT(*) INTO owner_count FROM "Users";
                    SELECT "Id" INTO owner_id FROM "Users" LIMIT 1;

                    IF EXISTS (SELECT 1 FROM "Skills" WHERE "UserId" IS NULL)
                       OR EXISTS (SELECT 1 FROM "Projects" WHERE "UserId" IS NULL)
                       OR EXISTS (SELECT 1 FROM "JobApplications" WHERE "UserId" IS NULL) THEN
                        IF owner_count <> 1 THEN
                            RAISE EXCEPTION 'Cannot assign legacy records: expected exactly one user, found %', owner_count;
                        END IF;

                        UPDATE "Skills" SET "UserId" = owner_id WHERE "UserId" IS NULL;
                        UPDATE "Projects" SET "UserId" = owner_id WHERE "UserId" IS NULL;
                        UPDATE "JobApplications" SET "UserId" = owner_id WHERE "UserId" IS NULL;
                    END IF;
                END $$;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Skills",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Projects",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "JobApplications",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Skills_UserId_Name_Category",
                table: "Skills",
                columns: new[] { "UserId", "Name", "Category" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Skills_UserId_Name_Category",
                table: "Skills");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Skills",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Projects",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "JobApplications",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "JobPostings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Company = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    RequiredSkills = table.Column<List<string>>(type: "text[]", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    Url = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobPostings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobPostings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Skills_UserId_Name_Category",
                table: "Skills",
                columns: new[] { "UserId", "Name", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_UserId",
                table: "JobPostings",
                column: "UserId");
        }
    }
}
