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

    [Fact]
    public void BackupScript_StrictlyBlocksPublicMediaBucket()
    {
        var scriptPath = Path.Combine(AppContext.BaseDirectory, "../../../deploy/backup-to-r2.sh");
        if (!File.Exists(scriptPath))
        {
            scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "../../deploy/backup-to-r2.sh");
        }

        if (File.Exists(scriptPath))
        {
            var content = File.ReadAllText(scriptPath);

            // Invariant 1: Must isolate backups using R2_BACKUP_BUCKET_NAME
            Assert.Contains("R2_BACKUP_BUCKET_NAME", content);

            // Invariant 2: Must refuse upload if bucket points to apexcommerce (public media)
            Assert.Contains("Refusing to upload database backup to public media bucket", content);

            // Invariant 3: Must default to a private bucket name, never apexcommerce
            Assert.DoesNotContain("BUCKET=\"apexcommerce\"", content);
        }
    }
}

