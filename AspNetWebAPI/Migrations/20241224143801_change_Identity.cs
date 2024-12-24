using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetCoreAPI.Migrations
{
    /// <inheritdoc />
    public partial class change_Identity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
            name: "PK_Orders",
            table: "Orders");

            // Zmena stĺpca OrderId, odstránenie identity
            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Orders",
                type: "int",
                nullable: false); // Už nie je automaticky generovaný

            // Pridanie primárneho kľúča späť
            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Zrušenie primárneho kľúča
            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                table: "Orders");

            // Obnovenie stĺpca OrderId ako identity
            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Orders",
                type: "int",
                nullable: false)
                .Annotation("SqlServer:Identity", "1, 1");

            // Pridanie primárneho kľúča späť
            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "OrderId");
        }
    }
}
