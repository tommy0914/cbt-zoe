-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "schoolId" TEXT;

-- CreateIndex
CREATE INDEX "Question_schoolId_idx" ON "Question"("schoolId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
