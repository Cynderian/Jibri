exports.run = (client, message) => {
    const version = 'Current Version: 1.1.0';
    const preamble = 'All data is as up-to-date as possible via eddb. Jibri can receive dms, and does not log data for any commands given.\n\n';
    const sphere = '\t~sphere <-o / -contests(optional)> <power> <system> designates a system as a midpoint, and grabs data for all populated systems within a 15ly sphere. If the target system is a control system, instead automatically shows control data. Adding -o will make it so the input power name is used regardless of control state. Example: ~sphere Winters Mbambiva\n';
    const multisphere = '\t~multisphere <system 1> <system 2> ... <system n> shows all systems overlapped by the 15ly spheres of the input systems.\n';
    const scout = '\t~scout <-profitables (optional)> <power> <internal/external> <days> compares current data to user-defined days old data to find any significant lead changes, for all CCC systems within AD space, or all systems witing 30ly external to AD space. Automatically adjusts for expansion state resolutions, and trims data more than 2 days out of date. Only \'internal\' is power-flexible. -profitables only checks profitable spheres (at max OH)\n';
    const faction = '\t~faction <faction name OR power> shows all systems in desceding inf lead order belonging to the specified faction (Powers to be implemented later).\n';
    const profitables = '\t~profitables <power> shows all existing profitable expansions for a power\n';
    // const threats = '!- Beta Command -! ~threats <friendly power> <hostile power> <distance from main star, in lightseconds> shows all systems with a Large landing pad within an input amount from Aisling space. This command does not currently publicly usable due to the massive amount of data it processes, please ping @Cynder#7567 for use.\n';
    const cc = '\t~cc <power> shows the total cc and systems controlled and exploited by a power. Good for confirming if database has been updated.\n';
    const postamble = 'The dates shown reflect when the leads were last updated, and are *roughly* autocorrected to the last tick time (faulty since EDO). Data is pulled from EDDB daily at 1am CST\n';
    message.channel.send(`\`\`\`\n${version}\n ${preamble}Commands:\n${sphere}\n${multisphere}\n${scout}\n${faction}\n${profitables}\n${cc}\n ${postamble}\`\`\``);
};