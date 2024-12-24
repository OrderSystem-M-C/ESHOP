using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetCoreAPI.Migrations
{
    /// <inheritdoc />
    public partial class change_KEY : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create a new column without the IDENTITY property
            migrationBuilder.AddColumn<int>(
            name: "NewOrderId",
            table: "Orders",
            nullable: false,
            defaultValue: 0);

            // Step 2: Copy data from the old 'OrderId' to the new column
            migrationBuilder.Sql("UPDATE Orders SET NewOrderId = OrderId");

            // Step 3: Drop the old 'OrderId' column
            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "Orders");

            // Step 4: Rename the new column to 'OrderId'
            migrationBuilder.RenameColumn(
                name: "NewOrderId",
                table: "Orders",
                newName: "OrderId");

            // Step 5: Add the primary key back to the 'OrderId' column
            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
            name: "PK_Orders",
            table: "Orders");

            // Step 2: Create a new column with the IDENTITY property
            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            // Step 3: Copy data back to the 'OrderId' column from the renamed one
            migrationBuilder.Sql("UPDATE Orders SET OrderId = NewOrderId");

            // Step 4: Drop the new column
            migrationBuilder.DropColumn(
                name: "NewOrderId",
                table: "Orders");

            // Step 5: Add the primary key back to the 'OrderId' column
            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "OrderId");
        }
    }
}
