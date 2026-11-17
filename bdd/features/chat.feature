Feature: Big Yellow customer chat
  The chat greets a customer, answers a known order, and the dashboard
  shows the safety checks an operator would read before a release.

  Scenario: the chat greets a customer
    Given I open the chat
    Then I see the greeting "hi bestie, big yellow here"
    And I see 4 suggested questions
    And the agent dashboard link is visible

  Scenario: order 1234 returns the demo shipment
    Given I open the chat
    When I ask "where's my order #1234"
    Then the reply includes "order #1234 is on its way"
    And the reply includes "canada post"
    And the reply is labeled "support agent"

  Scenario: the agent dashboard shows safety checks
    Given I open the agent dashboard
    Then I see "Safety checks and handoffs"
    And I see "add sample chats"
    And I see "recent events"
