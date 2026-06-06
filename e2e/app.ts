import type { Page } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { FriendsPage } from "./pages/friends.page";
import { GuildDetailPage } from "./pages/guild-detail.page";
import { GuildsPage } from "./pages/guilds.page";
import { LoginPage } from "./pages/login.page";
import { MoviesPage } from "./pages/movies.page";
import { RegisterPage } from "./pages/register.page";
import { SearchPalettePage } from "./pages/search-palette.page";
import { Sidebar } from "./pages/sidebar";

/**
 * Root page-object container: one instance of every page object for a given
 * `Page`. Instantiate per page — a second browser context needs its own
 * `new App(pageB)`.
 */
export class App {
  readonly dashboard: DashboardPage;
  readonly friends: FriendsPage;
  readonly guildDetail: GuildDetailPage;
  readonly guilds: GuildsPage;
  readonly login: LoginPage;
  readonly movies: MoviesPage;
  readonly register: RegisterPage;
  readonly searchPalette: SearchPalettePage;
  readonly sidebar: Sidebar;

  constructor(readonly page: Page) {
    this.dashboard = new DashboardPage(page);
    this.friends = new FriendsPage(page);
    this.guildDetail = new GuildDetailPage(page);
    this.guilds = new GuildsPage(page);
    this.login = new LoginPage(page);
    this.movies = new MoviesPage(page);
    this.register = new RegisterPage(page);
    this.searchPalette = new SearchPalettePage(page);
    this.sidebar = new Sidebar(page);
  }
}
