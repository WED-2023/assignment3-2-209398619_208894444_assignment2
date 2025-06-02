[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/WkLPf7o5)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-718a45dd9cf7e7f842a935f5ebbe5719a5e09af4491e668f4dbf3b35d5cca122.svg)](https://classroom.github.com/online_ide?assignment_repo_id=11168133&assignment_repo_type=AssignmentRepo)

# Grandma’s Recipes API

## Authors
- **Keren Londner** (ID: 209398619)  
- **Raz Ganon** (ID: 208894444)  

---

## Introduction
Welcome to the backend API for the “Grandma’s Recipes” project. This service was designed to support all mandatory endpoints—such as user authentication, recipe search, recipe details, favorites, and view-tracking—while ensuring stability and reliability. Due to time constraints and technical issues, we decided to not to implement the bonus features. Below you’ll find details about the change in scope, the reasons behind it, and how to get started.

---

## API Scope & Changes

### Implemented (Mandatory) Features
- **User Authentication**  
  - Sign up, login, and session management
- **Recipe Endpoints**  
  - Fetch random recipes  
  - Search recipes by keyword  
  - Get detailed information for a single recipe (including view count tracking)
- **Favorites Management**  
  - Add/remove recipes to user’s favorites  
  - List user’s favorite recipes
- **Personal/Family Recipes**  
  - Fetch personal recipes for the logged-in user  
  - Fetch family recipes (hardcoded entries)
- **Recipe Views Tracking**  
  - Increment view count when a recipe is retrieved  
  - Retrieve last 3 recipes viewed by the user
- **Utility Modules**  
  - `DButils` for database connection pooling  
  - `recipe_utils`, `user_utils`, `family_utils` for business logic  

### Removed (Bonus) Features from the API we wrote on swagger and implemented accordingly.

> **Reason for Removal:**  
> We opted to focus our efforts on completing and thoroughly testing all mandatory endpoints.
> Although the submission deadline was extended by one week, we encountered technical difficulties — particularly around the virtual machine and configuring the remote server.
> This consumed much of our remaining time by waiting and back and forth mailing with IT
> . Thus, we decided to get rid of bonus features so that the core functionality could be better and fully functional by submission.

---

## Technical Challenges & Timeline
1. **Virtual Machine Provisioning**  
   - Difficulty obtaining consistent SSH access  
   - Resulted in delayed backend environment setup

2. **Remote Server Configuration**  
   - SSL certificate/setup took longer than expected  

Because of these obstacles, we ensured that every mandatory endpoint works correctly, is documented, and passes basic sanity checks. Unfortunately, there was simply not enough time to develop and test extra bonus functionality without compromising core stability and proper testing of everything.

---


