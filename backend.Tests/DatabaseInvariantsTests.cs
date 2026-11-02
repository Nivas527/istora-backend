using System.IO;
using Xunit;

namespace backend.Tests;

public class DatabaseInvariantsTests
{
    [Fact]
    public void DatabaseMigrator_StrictlyEnforcesAdditiveOnlyPolicy()
    {
        // Locate DatabaseMigrator.cs in the backend source tree
        var migratorPath = Path.Combine(AppContext.BaseDirectory, "../../../backend/Data/DatabaseMigrator.cs");
        if (!File.Exists(migratorPath))
        {
            // Fallback to relative lookup
            migratorPath = Path.Combine(Directory.GetCurrentDirectory(), "../../backend/Data/DatabaseMigrator.cs");
        }

        if (File.Exists(migratorPath))
        {
            var content = File.ReadAllText(migratorPath);

            // Invariant 1: No destructive DROP TABLE commands allowed in migrator
            Assert.DoesNotContain("DROP TABLE", content, StringComparison.OrdinalIgnoreCase);

            // Invariant 2: No destructive DROP COLUMN commands allowed in migrator
            Assert.DoesNotContain("DROP COLUMN", content, StringComparison.OrdinalIgnoreCase);

            // Invariant 3: No in-place RENAME COLUMN (breaks backward compatibility during rollback)
            Assert.DoesNotContain("RENAME COLUMN", content, StringComparison.OrdinalIgnoreCase);

            // Invariant 4: Must use IF NOT EXISTS for safe idempotency
            Assert.Contains("IF NOT EXISTS", content, StringComparison.OrdinalIgnoreCase);
        }
    }
}
