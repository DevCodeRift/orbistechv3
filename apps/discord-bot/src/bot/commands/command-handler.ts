import { Client, Collection, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { AllianceCommand } from './alliance';
import { NationCommand } from './nation';
import { MemberCommand } from './member';
import { WarCommand } from './war';
import { HelpCommand } from './help';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: any, tenant: Tenant) => Promise<void>;
}

export class CommandHandler {
  private commands: Collection<string, Command> = new Collection();

  constructor(private tenant: Tenant) {
    this.loadCommands();
  }

  private loadCommands() {
    const commands = [
      new AllianceCommand(),
      new NationCommand(),
      new MemberCommand(),
      new WarCommand(),
      new HelpCommand(),
    ];

    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }
  }

  async register(client: Client) {
    const commandData = this.commands.map(command => command.data.toJSON());

    const rest = new REST({ version: '10' }).setToken(client.token!);

    try {
      console.log(`🔄 Registering ${commandData.length} slash commands for ${this.tenant.allianceName}...`);

      // Register commands globally or for specific guild
      if (this.tenant.discordGuildId) {
        // Guild-specific commands (faster updates)
        await rest.put(
          Routes.applicationGuildCommands(client.user!.id, this.tenant.discordGuildId),
          { body: commandData }
        );
      } else {
        // Global commands (slower updates but work everywhere)
        await rest.put(
          Routes.applicationCommands(client.user!.id),
          { body: commandData }
        );
      }

      console.log(`✅ Successfully registered slash commands for ${this.tenant.allianceName}`);
    } catch (error) {
      console.error(`❌ Failed to register slash commands for ${this.tenant.allianceName}:`, error);
    }
  }

  async handleInteraction(interaction: any) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, this.tenant);
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);

      const errorMessage = 'There was an error while executing this command!';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  getCommands(): Collection<string, Command> {
    return this.commands;
  }
}