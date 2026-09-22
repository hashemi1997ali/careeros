using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeDateColumnNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StartedAt",
                table: "Skills",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "UpdatedAtUtc",
                table: "Projects",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "CreatedAtUtc",
                table: "Projects",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "UpdatedAtUtc",
                table: "JobApplications",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "InterviewAtUtc",
                table: "JobApplications",
                newName: "InterviewAt");

            migrationBuilder.RenameColumn(
                name: "CreatedAtUtc",
                table: "JobApplications",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "AppliedAtUtc",
                table: "JobApplications",
                newName: "AppliedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "Skills",
                newName: "StartedAt");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Projects",
                newName: "UpdatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Projects",
                newName: "CreatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "JobApplications",
                newName: "UpdatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "InterviewAt",
                table: "JobApplications",
                newName: "InterviewAtUtc");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "JobApplications",
                newName: "CreatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "AppliedAt",
                table: "JobApplications",
                newName: "AppliedAtUtc");
        }
    }
}
