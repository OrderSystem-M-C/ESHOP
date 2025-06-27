using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace AspNetCoreAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<OrderModel> Orders { get; set; }
        public DbSet<OrderProductModel> OrderProducts { get; set; }
        public DbSet<ProductModel> Products { get; set; }
        public DbSet<EphSettingsModel> EphSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.Entity<OrderModel>()
                .HasKey(o => o.Id);

            base.OnModelCreating(builder);

            builder.Entity<OrderProductModel>()
                .HasKey(op => new { op.OrderId, op.ProductId });

            builder.Entity<OrderProductModel>()
                .HasOne(op => op.Order)
                .WithMany(o => o.OrderProducts)
                .HasForeignKey(op => op.OrderId);

            builder.Entity<ProductModel>()
                .HasQueryFilter(p => !p.IsDeleted);
        }
    }
}
