using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetCoreAPI.Migrations
{
    /// <inheritdoc />
    public partial class EphSettingsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EphSettings",
                columns: table => new
                {
                    EphSettingsId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EphPrefix = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    EphStartingNumber = table.Column<int>(type: "int", nullable: false),
                    EphEndingNumber = table.Column<int>(type: "int", nullable: false),
                    EphSuffix = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EphSettings", x => x.EphSettingsId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EphSettings");
        }
    }
}
