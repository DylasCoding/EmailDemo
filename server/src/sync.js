import sequelize from "../models/index.js";
import User from "../models/user.model.js";
import Email from "../models/email.model.js";

(async () => {
    try {
        await sequelize.sync({ force: true }); // ⚠️ Xoá và tạo lại bảng
        console.log("✅ All tables created successfully!");
        process.exit();
    } catch (err) {
        console.error("❌ Error syncing database:", err);
    }
})();
