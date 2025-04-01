/**
 * This function builds the add-on card whenever a user opens an email.
 * (Triggered by the 'contextualTriggers' in appsscript.json).
 */
function buildAddOn(e) {
  // e.messageMetadata gives info about the open message, e.g. e.messageMetadata.messageId
  var messageId = e.messageMetadata.messageId;

  // Create a button that calls blockDomain(), passing the message ID as a parameter.
  var action = CardService.newAction()
    .setFunctionName("blockDomain")
    .setParameters({ "messageId": messageId });

  var button = CardService.newTextButton()
    .setText("🚫 Domain") // The label on the button
    .setOnClickAction(action);

  // Put the button in a card section
  var section = CardService.newCardSection().addWidget(button);

  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle("Block This Domain?")
    )
    .addSection(section)
    .build();

  // Return the card to be rendered
  return [card];
}

/**
 * Main function that runs when user clicks "🚫 Domain."
 * 1) Finds/creates a "Blocked Domains" label.
 * 2) Creates a filter for *@domain => skip inbox + label.
 * 3) Immediately archives + labels the current message.
 */
function blockDomain(e) {
  Logger.log("blockDomain() triggered. Parameters: " + JSON.stringify(e.parameters));

  // 1) Get the messageId from the button click parameters.
  var messageId = e.parameters.messageId;
  Logger.log("Message ID = " + messageId);

  // 2) Fetch the message details using the advanced Gmail service
  var message;
  try {
    message = Gmail.Users.Messages.get('me', messageId);
    Logger.log("Fetched message: " + JSON.stringify(message));
  } catch (err) {
    Logger.log("Error fetching message: " + err);
    return buildActionResponseCard("Error: Could not fetch message. " + err);
  }

  // 3) Extract the "From" header to determine the domain
  var fromHeader = "";
  var headers = message.payload.headers;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === "from") {
      fromHeader = headers[i].value;
      break;
    }
  }
  Logger.log("Raw From header: " + fromHeader);

  if (!fromHeader) {
    return buildActionResponseCard("Error: Could not find 'From' header.");
  }

  var domain = getDomainFromFromHeader(fromHeader);
  if (!domain) {
    return buildActionResponseCard("Error: Could not parse domain from: " + fromHeader);
  }
  Logger.log("Parsed domain: " + domain);

  // 4) Find or create the "Blocked Domains" label
  var blockedLabelId;
  try {
    blockedLabelId = getOrCreateLabel("Blocked Domains");
    Logger.log("Using label ID: " + blockedLabelId);
  } catch (err) {
    Logger.log("Error getting/creating label: " + err);
    return buildActionResponseCard("Error: " + err);
  }

  // 5) Create the filter for *@<domain>, skipping inbox + applying label
  try {
    var filter = createBlockDomainFilter(domain, blockedLabelId);
    Logger.log("Filter creation result: " + JSON.stringify(filter));
  } catch (err) {
    Logger.log("Error creating filter: " + err);
    return buildActionResponseCard("Error creating filter: " + err);
  }

  // 6) Immediately label + archive the current message (remove "INBOX" label)
  try {
    var modifyRequest = {
      addLabelIds: [blockedLabelId],
      removeLabelIds: ["INBOX"]
    };
    var modifyResult = Gmail.Users.Messages.modify(modifyRequest, 'me', messageId);
    Logger.log("Message modify result: " + JSON.stringify(modifyResult));
  } catch (err) {
    Logger.log("Error archiving + labeling message: " + err);
    return buildActionResponseCard("Error archiving message: " + err);
  }

  // 7) Return a success card
  return buildActionResponseCard(
    "Success! Future emails from " + domain + " will be archived and labeled 'Blocked Domains'."
  );
}


/**
 * Tries to parse the domain from the From header.
 * E.g. "John <john@domain.com>" => "domain.com"
 */
function getDomainFromFromHeader(fromHeader) {
  // A simple approach: look for the substring after "@"
  var match = fromHeader.match(/@([^\> ]+)/);
  if (!match) return null;
  return match[1];
}


/**
 * Finds or creates a Gmail label with the given name, returns the label's ID.
 * Using the advanced Gmail service (Gmail.Users.Labels).
 */
function getOrCreateLabel(labelName) {
  var allLabels = Gmail.Users.Labels.list('me').labels;
  if (!allLabels) allLabels = [];

  // Check if it already exists
  var existing = allLabels.find(function(lbl) {
    return lbl.name === labelName;
  });
  if (existing) {
    return existing.id;
  }

  // Otherwise, create it
  var newLabel = {
    name: labelName,
    labelListVisibility: "labelShow",
    messageListVisibility: "show"
  };
  var created = Gmail.Users.Labels.create(newLabel, 'me');
  return created.id;
}


/**
 * Creates a filter for *@domain that:
 * - Skips Inbox (removeLabelIds: ["INBOX"])
 * - Applies the "Blocked Domains" label (addLabelIds: [labelId])
 * Returns the newly created Filter resource.
 */
function createBlockDomainFilter(domain, labelId) {
  var filter = {
    criteria: {
      from: "*@" + domain
    },
    action: {
      removeLabelIds: ["INBOX"],
      addLabelIds: [labelId]
    }
  };

  var createdFilter = Gmail.Users.Settings.Filters.create(filter, 'me');
  return createdFilter;
}


/**
 * Builds a CardService ActionResponse that updates the card UI with a message.
 */
function buildActionResponseCard(message) {
  var textWidget = CardService.newTextParagraph().setText(message);
  var section = CardService.newCardSection().addWidget(textWidget);
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle("🚫 Domain")
    )
    .addSection(section)
    .build();

  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation().updateCard(card)
    )
    .build();
}


