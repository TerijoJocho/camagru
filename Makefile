UPLOADS_DIR := app/uploads

.PHONY: all up down re logs clean fclean uploads

all: up

uploads:
	mkdir -p $(UPLOADS_DIR)

up: uploads
	docker-compose up --build

down:
	docker-compose down

re: down up

logs:
	docker-compose logs -f

clean: down
	rm -rf $(UPLOADS_DIR)

fclean: clean
	docker-compose down -v --rmi all