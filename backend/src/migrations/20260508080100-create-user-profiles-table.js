"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_profiles", {
      user_id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
      },
      last_name: {
        type: Sequelize.STRING(100),
      },
      id_card: {
        type: Sequelize.STRING(20),
        unique: true,
      },
      avatar_url: {
        type: Sequelize.TEXT,
      },
      cover_photo_url: {
        type: Sequelize.TEXT,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_profiles");
  },
};
