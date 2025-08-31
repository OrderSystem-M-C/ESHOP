using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspNetCoreAPI.Migrations
{
    /// <inheritdoc />
    public partial class Remove_AddOrderIdSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DECLARE @constraintName NVARCHAR(128)
                  SELECT @constraintName = name
                  FROM sys.default_constraints
                  WHERE parent_object_id = OBJECT_ID('Orders')
                    AND parent_column_id = (
                        SELECT column_id
                        FROM sys.columns
                        WHERE object_id = OBJECT_ID('Orders')
                          AND name = 'OrderId'
                    )
                  IF @constraintName IS NOT NULL
                      EXEC('ALTER TABLE Orders DROP CONSTRAINT ' + @constraintName)"
            );

            migrationBuilder.DropSequence(name: "OrderIdSequence");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Orders",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValueSql: "NEXT VALUE FOR OrderIdSequence");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<int>(
                name: "OrderIdSequence",
                startValue: 100000L);

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValueSql: "NEXT VALUE FOR OrderIdSequence",
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
