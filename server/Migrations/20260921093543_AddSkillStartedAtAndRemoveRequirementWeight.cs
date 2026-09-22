using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillStartedAtAndRemoveRequirementWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "StartedAt",
                table: "Skills",
                type: "date",
                nullable: true);

            migrationBuilder.DropCheckConstraint(
                name: "CK_JobRequirements_Weight",
                table: "JobRequirements");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "JobRequirements");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Weight",
                table: "JobRequirements",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddCheckConstraint(
                name: "CK_JobRequirements_Weight",
                table: "JobRequirements",
                sql: "\"Weight\" BETWEEN 1 AND 5");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "Skills");
        }
    }
}
