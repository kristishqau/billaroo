using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityAuditLogTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoginHistory_Users_UserId",
                table: "LoginHistory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LoginHistory",
                table: "LoginHistory");

            migrationBuilder.DropIndex(
                name: "IX_LoginHistory_UserId",
                table: "LoginHistory");

            migrationBuilder.RenameTable(
                name: "LoginHistory",
                newName: "LoginHistories");

            migrationBuilder.AlterColumn<string>(
                name: "TimeZone",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowMessages",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Company",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CvUploadedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CvUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitHubUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsIdentityVerified",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPhoneVerified",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsProfileComplete",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastTwoFactorUsed",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MarketingEmails",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhoneVerificationCode",
                table: "Users",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PhoneVerificationExpiry",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PortfolioUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowAddress",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowEmail",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowPhone",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Street",
                table: "Users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TwitterUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorEnabled",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string[]>(
                name: "TwoFactorRecoveryCodes",
                table: "Users",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TwoFactorSecret",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerificationDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationDocumentUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationStatus",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "Unverified");

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                table: "LoginHistories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                table: "LoginHistories",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceInfo",
                table: "LoginHistories",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTwoFactorUsed",
                table: "LoginHistories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "LoginHistories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_LoginHistories",
                table: "LoginHistories",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TemplateType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityAuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SecurityAuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSkills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    SkillName = table.Column<string>(type: "text", nullable: false),
                    ProficiencyLevel = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSkills_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsDeleted",
                table: "Users",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TwoFactorEnabled",
                table: "Users",
                column: "TwoFactorEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_Users_VerificationStatus",
                table: "Users",
                column: "VerificationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_LoginHistories_LoginTime",
                table: "LoginHistories",
                column: "LoginTime");

            migrationBuilder.CreateIndex(
                name: "IX_LoginHistories_UserId_LoginTime",
                table: "LoginHistories",
                columns: new[] { "UserId", "LoginTime" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_TemplateType",
                table: "EmailTemplates",
                column: "TemplateType",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityAuditLogs_Action",
                table: "SecurityAuditLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityAuditLogs_Timestamp",
                table: "SecurityAuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityAuditLogs_UserId_Timestamp",
                table: "SecurityAuditLogs",
                columns: new[] { "UserId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSkills_UserId_SkillName",
                table: "UserSkills",
                columns: new[] { "UserId", "SkillName" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LoginHistories_Users_UserId",
                table: "LoginHistories",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoginHistories_Users_UserId",
                table: "LoginHistories");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "SecurityAuditLogs");

            migrationBuilder.DropTable(
                name: "UserSkills");

            migrationBuilder.DropIndex(
                name: "IX_Users_IsDeleted",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TwoFactorEnabled",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_VerificationStatus",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LoginHistories",
                table: "LoginHistories");

            migrationBuilder.DropIndex(
                name: "IX_LoginHistories_LoginTime",
                table: "LoginHistories");

            migrationBuilder.DropIndex(
                name: "IX_LoginHistories_UserId_LoginTime",
                table: "LoginHistories");

            migrationBuilder.DropColumn(
                name: "AllowMessages",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Company",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CvUploadedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CvUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GitHubUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsIdentityVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPhoneVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsProfileComplete",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "JobTitle",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastTwoFactorUsed",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MarketingEmails",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneVerificationCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneVerificationExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PortfolioUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShowAddress",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShowEmail",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShowPhone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Street",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwitterUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorRecoveryCodes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorSecret",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationDocumentUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeviceInfo",
                table: "LoginHistories");

            migrationBuilder.DropColumn(
                name: "IsTwoFactorUsed",
                table: "LoginHistories");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "LoginHistories");

            migrationBuilder.RenameTable(
                name: "LoginHistories",
                newName: "LoginHistory");

            migrationBuilder.AlterColumn<string>(
                name: "TimeZone",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserAgent",
                table: "LoginHistory",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IpAddress",
                table: "LoginHistory",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(45)",
                oldMaxLength: 45,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_LoginHistory",
                table: "LoginHistory",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_LoginHistory_UserId",
                table: "LoginHistory",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LoginHistory_Users_UserId",
                table: "LoginHistory",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
