using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetCoreAPI.Migrations
{
    /// <inheritdoc />
    public partial class remove_orders_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
              name: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
        name: "Orders",
        columns: table => new
        {
            Id = table.Column<int>(nullable: false)
                .Annotation("SqlServer:Identity", "1, 1"),
            OrderId = table.Column<int>(nullable: false),
            CustomerName = table.Column<string>(maxLength: 100, nullable: false),
            Company = table.Column<string>(maxLength: 100, nullable: true),
            ICO = table.Column<string>(maxLength: 20, nullable: true),
            DIC = table.Column<string>(maxLength: 20, nullable: true),
            ICDPH = table.Column<string>(maxLength: 20, nullable: true),
            Address = table.Column<string>(maxLength: 200, nullable: false),
            City = table.Column<string>(maxLength: 100, nullable: false),
            PostalCode = table.Column<string>(maxLength: 10, nullable: false),
            Email = table.Column<string>(nullable: false),
            PhoneNumber = table.Column<string>(maxLength: 50, nullable: true),
            Note = table.Column<string>(maxLength: 250, nullable: true),
            DeliveryOption = table.Column<string>(nullable: false),
            PaymentOption = table.Column<string>(nullable: false),
            DiscountAmount = table.Column<int>(nullable: false, defaultValue: 0),
            OrderStatus = table.Column<string>(nullable: false),
            OrderDate = table.Column<string>(nullable: false)
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_Orders", x => x.Id);
        });
        }
    }
}
